import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Normalize phone number to 07xxxxxxxx
const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+254")) return "0" + digits.slice(3);
  if (digits.startsWith("254")) return "0" + digits.slice(3);
  if (digits.startsWith("7")) return "0" + digits;
  if (digits.startsWith("0")) return digits;
  return digits;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber, password, role } = req.body;

    if (!name || !phoneNumber || !password || !role)
      return res.status(400).json({ error: "Missing fields" });

    const normalizedPhone = normalizePhone(phoneNumber);

    const exists = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber: normalizedPhone,
        password: hashed,
        role: role.toLowerCase(),
      },
    });

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { phoneNumber, password, role } = req.body;

    if (!phoneNumber || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const normalizedPhone = normalizePhone(phoneNumber);

    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user)
      return res.status(401).json({ error: "Invalid phone number or password" });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid)
      return res.status(401).json({ error: "Invalid phone number or password" });

    if (role && user.role !== role.toLowerCase()) {
      return res.status(403).json({
        error: `This account is registered as ${user.role}, not ${role}`,
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/change-password
 * Body: { oldPassword, newPassword }
 * Requires authenticated user (req.user)
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: "oldPassword and newPassword required" });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(oldPassword, dbUser.password);
    if (!match) return res.status(403).json({ error: "Old password incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed }});

    return res.json({ ok: true, message: "Password changed" });
  } catch (err: any) {
    console.error("changePassword error:", err);
    return res.status(500).json({ error: "server error" });
  }
};
