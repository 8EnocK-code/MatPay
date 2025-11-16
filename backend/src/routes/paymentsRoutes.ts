// backend/src/routes/paymentsRoutes.ts

import express from "express";
import { initiatePayment, mpesaCallback, getPaymentStatus } from "../controllers/paymentsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Public callback endpoint (no auth required - AT will call this)
router.post("/callback", mpesaCallback);

// Protected endpoints
router.post("/initiate", authMiddleware, initiatePayment);
router.get("/status/:paymentId", authMiddleware, getPaymentStatus);

export default router;

