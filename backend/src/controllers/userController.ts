import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import { UserRole } from "@prisma/client";

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { role } = req.query;

    const where: any = {};

    if (role) {
      where.role = role as UserRole;
    }

    // Owners can only see drivers/conductors
    if (req.user.role === "owner") {
      if (role && role !== "driver" && role !== "conductor") {
        res.status(403).json({ error: "You can only view drivers and conductors" });
        return;
      }
      if (!role) {
        where.role = {
          in: ["driver", "conductor"],
        };
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        role: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

