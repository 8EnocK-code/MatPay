// backend/src/controllers/walletController.ts

import { Request, Response } from "express";
import prisma from "../prismaClient";

/**
 * GET /api/wallet/balance
 * returns { balance }
 */
export async function getBalance(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id }});
    return res.json({ balance: wallet?.balance ?? 0 });
  } catch (err: any) {
    console.error("getBalance error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

/**
 * POST /api/wallet/withdraw
 * Body: { amount, note? }
 * Creates a Withdrawal request and reduces available balance in optimistic way.
 */
export async function requestWithdrawal(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const { amount, note } = req.body;
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: "invalid amount" });

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id }});
    if (!wallet) return res.status(400).json({ error: "wallet not found" });

    if (wallet.balance < amt) return res.status(400).json({ error: "insufficient balance" });

    // Optional: reduce wallet balance immediately to prevent double-withdraw
    await prisma.wallet.update({
      where: { userId: user.id },
      data: { balance: wallet.balance - amt },
    });

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount: Math.round(amt),
        status: "PENDING",
        note: note ?? null,
      },
    });

    // Optionally create a transaction log here (not required)
    return res.status(201).json({ ok: true, withdrawal });
  } catch (err: any) {
    console.error("requestWithdrawal error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

