import { Router } from "express";
import { getRoutes, createRoute } from "../controllers/routeController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getRoutes);
router.post("/", authMiddleware, createRoute);

export default router;

