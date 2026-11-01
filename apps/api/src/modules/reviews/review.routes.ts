import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createReviewSchema } from "@ecommereproject/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getReviews, postReview } from "./review.controller.js";

// Mounted at /api/v1 in app.ts, so these paths read as
// /api/v1/products/:id/reviews — matching ARCHITECTURE.md's API design.
const router = Router();

router.get("/products/:id/reviews", asyncHandler(getReviews));
router.post("/products/:id/reviews", authenticate, validate(createReviewSchema), asyncHandler(postReview));

export default router;
