import { Router } from "express";
import { register, login, changePassword } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
} from "../controllers/passwordResetController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;
