import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createCategorySchema, updateCategorySchema } from "@ecommereproject/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getCategories, patchCategory, postCategory } from "./category.controller.js";

const router = Router();

router.get("/", asyncHandler(getCategories));
router.post("/", authenticate, requireRole("admin"), validate(createCategorySchema), asyncHandler(postCategory));
router.patch("/:id", authenticate, requireRole("admin"), validate(updateCategorySchema), asyncHandler(patchCategory));

export default router;
