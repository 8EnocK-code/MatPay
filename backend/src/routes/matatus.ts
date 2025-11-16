import { Router } from "express";
import { getMatatus, createMatatu } from "../controllers/matatuController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getMatatus);
router.post("/", createMatatu);

export default router;

