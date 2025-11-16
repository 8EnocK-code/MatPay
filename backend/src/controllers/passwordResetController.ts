// backend/src/controllers/passwordResetController.ts

import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Normalize phone number
const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+254")) return "0" + digits.slice(3);
  if (digits.startsWith("254")) return "0" + digits.slice(3);
  if (digits.startsWith("7")) return "0" + digits;
  if (digits.startsWith("0")) return digits;
  return digits;
};

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/forgot-password
 * Body: { phoneNumber }
 * Sends OTP to user's phone (in production, use SMS service)
 */
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "phoneNumber required" });

    const normalizedPhone = normalizePhone(phoneNumber);

    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        ok: true,
        message: "If this phone number is registered, an OTP will be sent",
      });
    }

    // Generate OTP and token
    const otp = generateOTP();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old unused resets for this user
    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { lt: new Date() },
      },
    });

    // Create new reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        phoneNumber: normalizedPhone,
        otp,
        token,
        expiresAt,
      },
    });

    // In production, send OTP via SMS (Africa's Talking, Twilio, etc.)
    // For now, log it (REMOVE IN PRODUCTION)
    console.log(`[PASSWORD RESET] OTP for ${normalizedPhone}: ${otp}`);
    console.log(`[PASSWORD RESET] Token: ${token}`);

    return res.json({
      ok: true,
      message: "OTP sent to your phone number",
      // In development, return OTP for testing (REMOVE IN PRODUCTION)
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
      token: process.env.NODE_ENV === "development" ? token : undefined,
    });
  } catch (err: any) {
    console.error("requestPasswordReset error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

/**
 * POST /api/auth/verify-otp
 * Body: { phoneNumber, otp, token }
 * Verifies OTP and returns reset token
 */
export async function verifyOTP(req: Request, res: Response) {
  try {
    const { phoneNumber, otp, token } = req.body;
    if (!phoneNumber || !otp || !token)
      return res.status(400).json({ error: "phoneNumber, otp, and token required" });

    const normalizedPhone = normalizePhone(phoneNumber);

    const reset = await prisma.passwordReset.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        token,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!reset) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true },
    });

    return res.json({
      ok: true,
      message: "OTP verified",
      resetToken: token, // Use this token to reset password
    });
  } catch (err: any) {
    console.error("verifyOTP error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { phoneNumber, token, newPassword }
 * Resets password after OTP verification
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { phoneNumber, token, newPassword } = req.body;
    if (!phoneNumber || !token || !newPassword)
      return res.status(400).json({ error: "phoneNumber, token, and newPassword required" });

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedPhone = normalizePhone(phoneNumber);

    // Verify token was used (OTP was verified)
    const reset = await prisma.passwordReset.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        token,
        used: true, // Must have been verified
        expiresAt: { gt: new Date(Date.now() - 30 * 60 * 1000) }, // Token valid for 30 min after verification
      },
      include: { user: true },
    });

    if (!reset) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashed },
    });

    // Delete all reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: reset.userId },
    });

    return res.json({
      ok: true,
      message: "Password reset successfully",
    });
  } catch (err: any) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

