import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function getRoutes(req: Request, res: Response): Promise<void> {
  try {
    const routes = await prisma.route.findMany({
      include: {
        fareRules: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(routes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function createRoute(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Only sacco/admin can create routes
    if (req.user.role !== "sacco" && req.user.role !== "admin") {
      res.status(403).json({ error: "Only SACCO admins can create routes" });
      return;
    }

    const { name, from, to, distance, fareRules } = req.body;

    if (!name || !from || !to) {
      res.status(400).json({ error: "Missing required fields: name, from, to" });
      return;
    }

    const route = await prisma.route.create({
      data: {
        name,
        from,
        to,
        distance: distance || null,
        fareRules: fareRules
          ? {
              create: fareRules.map((rule: any) => ({
                fareType: rule.fareType,
                amount: rule.amount,
              })),
            }
          : undefined,
      },
      include: {
        fareRules: true,
      },
    });

    res.status(201).json(route);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

