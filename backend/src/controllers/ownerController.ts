// backend/src/controllers/ownerController.ts

import { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Minimal middleware that checks req.user.role === 'OWNER'.
 * Uses existing auth middleware structure.
 */
export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  // Expect req.user from your auth middleware (JWT)
  const user = (req as any).user;
  if (!user || user.role?.toLowerCase() !== "owner") {
    return res.status(403).json({ error: "Owner role required" });
  }
  next();
};

/**
 * POST /api/owner/users
 * body: { name, phoneNumber, password, role } role="driver"|"conductor"
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber, password, role } = req.body;
    if (!name || !phoneNumber || !password || !role) return res.status(400).json({ error: "Missing fields" });

    const allowed = ["driver", "conductor"];
    if (!allowed.includes(role.toLowerCase())) return res.status(400).json({ error: "Invalid role" });

    const existing = await prisma.user.findUnique({ where: { phoneNumber }});
    if (existing) return res.status(409).json({ error: "Phone number already exists" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        password: hashed,
        role: role.toUpperCase() as any, // ensure schema enum matches
      },
      select: { id: true, name: true, phoneNumber: true, role: true, createdAt: true }
    });

    return res.status(201).json({ ok: true, user });
  } catch (err: any) {
    console.error("createUser error:", err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
};

