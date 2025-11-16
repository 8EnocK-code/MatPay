import { Router } from "express";
import { getRevenueSplits, getRevenueSplitById } from "../controllers/revenueController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getRevenueSplits);
router.get("/:id", getRevenueSplitById);

export default router;

