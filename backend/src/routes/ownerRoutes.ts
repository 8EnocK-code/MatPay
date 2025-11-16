// backend/src/routes/ownerRoutes.ts

import express from "express";
import {
  ownerCreateUser,
  ownerListUsers,
  ownerDeleteUser,
} from "../controllers/ownerUserController";
import { requireOwner } from "../middleware/requireOwner";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, requireOwner, ownerCreateUser);
router.get("/", authMiddleware, requireOwner, ownerListUsers);
router.delete("/:userId", authMiddleware, requireOwner, ownerDeleteUser);

export default router;

