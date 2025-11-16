// backend/src/controllers/analyticsController.ts

import { Request, Response } from "express";
import prisma from "../prismaClient";
import { PaymentStatus } from "@prisma/client";

/**
 * GET /api/owner/revenue-split
 * returns percentages for owner/driver/conductor based on confirmed payments
 */
export const revenueSplit = async (req: Request, res: Response) => {
  try {
    // aggregate successful payments joined to revenue splits if you have revenue split model
    const payments = await prisma.payment.findMany({ where: { status: PaymentStatus.received }});
    const total = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    if (total === 0) return res.json({ owner: 0, driver: 0, conductor: 0 });

    // Try to get actual revenue splits from RevenueSplit model
    const revenueSplits = await prisma.revenueSplit.findMany({
      where: {
        trip: {
          payments: {
            some: {
              status: PaymentStatus.received
            }
          }
        }
      }
    });

    if (revenueSplits.length > 0) {
      // Calculate actual percentages from revenue splits
      const ownerTotal = revenueSplits.reduce((s, r) => s + Number(r.ownerAmount || 0), 0);
      const driverTotal = revenueSplits.reduce((s, r) => s + Number(r.driverAmount || 0), 0);
      const conductorTotal = revenueSplits.reduce((s, r) => s + Number(r.conductorAmount || 0), 0);
      const splitTotal = ownerTotal + driverTotal + conductorTotal;

      if (splitTotal > 0) {
        const owner = Math.round((ownerTotal / splitTotal) * 100);
        const driver = Math.round((driverTotal / splitTotal) * 100);
        const conductor = 100 - owner - driver;
        return res.json({ owner, driver, conductor });
      }
    }

    // Fallback: if you have RevenueSplit model, compute precisely; for now assume hard-coded proportions per trip:
    // Example: owner 50%, driver 30%, conductor 20%
    const owner = 50;
    const driver = 30;
    const conductor = 20;
    return res.json({ owner, driver, conductor });
  } catch (err: any) {
    console.error("revenueSplit error:", err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
};

