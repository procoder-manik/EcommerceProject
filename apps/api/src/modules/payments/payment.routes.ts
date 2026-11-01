import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createPaymentIntentSchema } from "@ecommereproject/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createIntent } from "./payment.controller.js";

// The webhook route is NOT here — it needs express.raw() for signature
// verification and is mounted directly in app.ts, ahead of express.json().
const router = Router();

router.post("/create-intent", authenticate, validate(createPaymentIntentSchema), asyncHandler(createIntent));

export default router;
