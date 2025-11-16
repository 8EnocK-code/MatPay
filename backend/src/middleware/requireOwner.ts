import { Request, Response, NextFunction } from "express";

/**
 * Expects req.user to exist (populated by your auth middleware).
 * If your project uses a different property, adapt accordingly.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Authentication required" });
  
  // Check both uppercase and lowercase (Prisma enum is lowercase)
  const role = user.role?.toUpperCase();
  if (role !== "OWNER" && role !== "SACCO") {
    return res.status(403).json({ error: "Owner access required" });
  }
  next();
}

