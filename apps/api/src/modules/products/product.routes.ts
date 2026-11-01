import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createProductSchema, updateProductSchema } from "@ecommereproject/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { deleteProduct, getProduct, getProducts, patchProduct, postProduct } from "./product.controller.js";

const router = Router();

router.get("/", asyncHandler(getProducts));
router.get("/:slug", asyncHandler(getProduct));
router.post("/", authenticate, requireRole("admin"), validate(createProductSchema), asyncHandler(postProduct));
router.patch("/:id", authenticate, requireRole("admin"), validate(updateProductSchema), asyncHandler(patchProduct));
router.delete("/:id", authenticate, requireRole("admin"), asyncHandler(deleteProduct));

export default router;
