import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createOrderSchema, updateOrderStatusSchema } from "@ecommereproject/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createOrder, getAllOrders, getMyOrders, getOrder, patchOrderStatus } from "./order.controller.js";

const router = Router();

router.post("/", authenticate, validate(createOrderSchema), asyncHandler(createOrder));
router.get("/", authenticate, asyncHandler(getMyOrders));
router.get("/:id", authenticate, asyncHandler(getOrder));

export const adminOrderRouter = Router();
adminOrderRouter.get("/", authenticate, requireRole("admin"), asyncHandler(getAllOrders));
adminOrderRouter.patch(
  "/:id/status",
  authenticate,
  requireRole("admin"),
  validate(updateOrderStatusSchema),
  asyncHandler(patchOrderStatus)
);

export default router;
