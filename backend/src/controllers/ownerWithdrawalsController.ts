// backend/src/controllers/ownerWithdrawalsController.ts

import { Request, Response } from "express";
import prisma from "../prismaClient";

/**
 * GET /api/owner/withdrawals
 * Owner-only: list pending and recent withdrawals
 */
export async function listWithdrawals(req: Request, res: Response) {
  try {
    const items = await prisma.withdrawal.findMany({
      orderBy: { requestedAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, name: true, phoneNumber: true, role: true } } },
    });
    return res.json({ items });
  } catch (err: any) {
    console.error("listWithdrawals error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

/**
 * POST /api/owner/withdrawals/:id/process
 * Body: { action: "approve"|"decline", note? }
 */
export async function processWithdrawal(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const { id } = req.params;
    const { action, note } = req.body; // action: "approve"|"decline"
    if (!["approve", "decline"].includes(action)) return res.status(400).json({ error: "invalid action" });

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id }});
    if (!withdrawal) return res.status(404).json({ error: "withdrawal not found" });
    if (withdrawal.status !== "PENDING") return res.status(400).json({ error: "already processed" });

    if (action === "approve") {
      // Mark approved, record processedBy
      await prisma.withdrawal.update({
        where: { id },
        data: { status: "APPROVED", processedAt: new Date(), processedBy: user.id, note: note ?? null },
      });

      // NOTE: No external payout is performed here. Owner must perform payout externally, or later integrate MPesa B2C.
      return res.json({ ok: true, message: "withdrawal approved" });
    } else {
      // Decline: refund wallet
      await prisma.withdrawal.update({
        where: { id },
        data: { status: "DECLINED", processedAt: new Date(), processedBy: user.id, note: note ?? null },
      });

      // Refund the amount to user's wallet
      await prisma.wallet.update({
        where: { userId: withdrawal.userId },
        data: { balance: { increment: withdrawal.amount } },
      });

      return res.json({ ok: true, message: "withdrawal declined and refunded" });
    }
  } catch (err: any) {
    console.error("processWithdrawal error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

