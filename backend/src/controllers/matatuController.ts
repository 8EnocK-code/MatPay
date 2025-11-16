import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function getMatatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let matatus;

    // Owners can only see their own matatus
    if (req.user.role === "owner") {
      matatus = await prisma.matatu.findMany({
        where: {
          ownerId: req.user.id,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          plateNumber: "asc",
        },
      });
    } else {
      // Sacco/admin can see all matatus
      matatus = await prisma.matatu.findMany({
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          plateNumber: "asc",
        },
      });
    }

    res.json(matatus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function createMatatu(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Only owners can create matatus
    if (req.user.role !== "owner") {
      res.status(403).json({ error: "Only owners can register matatus" });
      return;
    }

    const { plateNumber, model, capacity } = req.body;

    if (!plateNumber) {
      res.status(400).json({ error: "Plate number is required" });
      return;
    }

    // Check if plate number already exists
    const existing = await prisma.matatu.findUnique({
      where: { plateNumber },
    });

    if (existing) {
      res.status(400).json({ error: "Matatu with this plate number already exists" });
      return;
    }

    const matatu = await prisma.matatu.create({
      data: {
        plateNumber,
        model: model || null,
        capacity: capacity || 14,
        ownerId: req.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    res.status(201).json(matatu);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

