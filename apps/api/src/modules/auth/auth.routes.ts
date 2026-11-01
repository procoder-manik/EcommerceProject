import { Router } from "express";
import {
  forgotPassword,
  googleOAuthStub,
  login,
  logout,
  refresh,
  register,
  resetPassword,
} from "./auth.controller.js";
import { authLimiter } from "../../middleware/rateLimit.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@ecommereproject/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), asyncHandler(register));
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));
router.get("/google", googleOAuthStub);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post("/reset-password", validate(resetPasswordSchema), asyncHandler(resetPassword));

export default router;
