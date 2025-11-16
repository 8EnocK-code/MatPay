import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";

const SALT = 10;

export async function ownerCreateUser(req: Request, res: Response) {
  try {
    const { name, phoneNumber, password, role } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !password || !role) {
      return res.status(400).json({ error: "Missing required fields: name, phoneNumber, password, role" });
    }

    if (!["driver", "conductor"].includes(role.toLowerCase())) {
      return res.status(400).json({ error: "Role must be driver or conductor" });
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    const finalPhone = normalizedPhone.startsWith("254") 
      ? "0" + normalizedPhone.slice(3)
      : normalizedPhone.startsWith("7")
      ? "0" + normalizedPhone
      : normalizedPhone.startsWith("0")
      ? normalizedPhone
      : "0" + normalizedPhone;

    const exists = await prisma.user.findUnique({ where: { phoneNumber: finalPhone }});
    if (exists) return res.status(409).json({ error: "User with this phone number already exists" });

    const hashed = await bcrypt.hash(password, SALT);

    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber: finalPhone,
        password: hashed,
        role: role.toLowerCase() as any, // Prisma enum is lowercase
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    // Initialize wallet
    await prisma.wallet.create({ data: { userId: user.id, balance: 0 } });

    return res.status(201).json({ ok: true, user });
  } catch (e: any) {
    console.error("ownerCreateUser error:", e);
    // Return more specific error messages
    if (e.code === "P2002") {
      return res.status(409).json({ error: "User with this phone number already exists" });
    }
    res.status(500).json({ error: e.message || "server error" });
  }
}

export async function ownerListUsers(req: Request, res: Response) {
  try {
    const drivers = await prisma.user.findMany({ 
      where: { role: "driver" }, // Prisma enum is lowercase
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });
    const conductors = await prisma.user.findMany({ 
      where: { role: "conductor" }, // Prisma enum is lowercase
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });
    res.json({ drivers, conductors });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
}

export async function ownerDeleteUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    // Verify user exists and is driver or conductor
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!["driver", "conductor"].includes(user.role.toLowerCase())) {
      return res.status(400).json({ error: "Can only delete drivers or conductors" });
    }

    await prisma.user.delete({ where: { id: userId }});
    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
}

