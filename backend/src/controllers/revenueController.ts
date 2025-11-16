import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function getRevenueSplits(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let revenueSplits;

    if (req.user.role === "owner") {
      revenueSplits = await prisma.revenueSplit.findMany({
        where: {
          ownerId: req.user.id,
        },
        include: {
          trip: {
            include: {
              route: true,
              matatu: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          conductor: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (req.user.role === "driver") {
      revenueSplits = await prisma.revenueSplit.findMany({
        where: {
          driverId: req.user.id,
        },
        include: {
          trip: {
            include: {
              route: true,
              matatu: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          conductor: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (req.user.role === "conductor") {
      revenueSplits = await prisma.revenueSplit.findMany({
        where: {
          conductorId: req.user.id,
        },
        include: {
          trip: {
            include: {
              route: true,
              matatu: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          conductor: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Sacco/admin can see all
      revenueSplits = await prisma.revenueSplit.findMany({
        include: {
          trip: {
            include: {
              route: true,
              matatu: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          conductor: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    res.json(revenueSplits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getRevenueSplitById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const revenueSplit = await prisma.revenueSplit.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            route: true,
            matatu: true,
            payments: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        conductor: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!revenueSplit) {
      res.status(404).json({ error: "Revenue split not found" });
      return;
    }

    // Check authorization
    if (
      req.user.role !== "sacco" &&
      req.user.role !== "admin" &&
      revenueSplit.ownerId !== req.user.id &&
      revenueSplit.driverId !== req.user.id &&
      revenueSplit.conductorId !== req.user.id
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json(revenueSplit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

