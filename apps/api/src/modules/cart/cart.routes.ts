import { Router } from "express";
import { maybeAuthenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { addCartItemSchema, syncCartSchema, updateCartItemSchema } from "@ecommereproject/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { addItem, getCart, removeItem, syncCart, updateItem } from "./cart.controller.js";

const router = Router();

// Guests can shop too — maybeAuthenticate attaches req.user when a valid
// token is present but never blocks the request when it's absent.
router.use(maybeAuthenticate);

router.get("/", asyncHandler(getCart));
router.put("/", validate(syncCartSchema), asyncHandler(syncCart));
router.post("/items", validate(addCartItemSchema), asyncHandler(addItem));
router.patch("/items/:itemId", validate(updateCartItemSchema), asyncHandler(updateItem));
router.delete("/items/:itemId", asyncHandler(removeItem));

export default router;
