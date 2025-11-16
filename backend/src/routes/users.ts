import { Router } from "express";
import { getUsers } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getUsers);

export default router;

