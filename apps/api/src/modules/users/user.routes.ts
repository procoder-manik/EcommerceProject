import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateUserRoleSchema } from "@ecommereproject/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMe, getUsers, patchUserRole, updateMe } from "./user.controller.js";

const router = Router();

router.get("/me", authenticate, asyncHandler(getMe));
router.patch("/me", authenticate, asyncHandler(updateMe));
router.get("/", authenticate, requireRole("admin"), asyncHandler(getUsers));
router.patch("/:id/role", authenticate, requireRole("admin"), validate(updateUserRoleSchema), asyncHandler(patchUserRole));

export default router;
