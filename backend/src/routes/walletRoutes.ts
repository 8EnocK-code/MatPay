// backend/src/routes/walletRoutes.ts

import express from "express";
import { getBalance, requestWithdrawal } from "../controllers/walletController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/balance", authMiddleware, getBalance);
router.post("/withdraw", authMiddleware, requestWithdrawal);

export default router;

