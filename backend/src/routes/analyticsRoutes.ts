// backend/src/routes/analyticsRoutes.ts

import express from "express";
import { revenueSplit } from "../controllers/analyticsController";
import { requireOwner } from "../controllers/ownerController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/revenue-split", authMiddleware, requireOwner, revenueSplit);

export default router;

