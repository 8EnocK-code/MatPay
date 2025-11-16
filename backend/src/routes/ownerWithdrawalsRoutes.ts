// backend/src/routes/ownerWithdrawalsRoutes.ts

import express from "express";
import { listWithdrawals, processWithdrawal } from "../controllers/ownerWithdrawalsController";
import { requireOwner } from "../middleware/requireOwner";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, requireOwner, listWithdrawals);
router.post("/:id/process", authMiddleware, requireOwner, processWithdrawal);

export default router;

