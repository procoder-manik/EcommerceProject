import { randomUUID } from "node:crypto";
import type { Response } from "express";
import type { AuthedRequest } from "../../middleware/auth.middleware.js";
import type { CartOwner } from "./cart.service.js";
import { addItemToCart, getOrCreateCart, removeCartItem, replaceCartItems, updateCartItem } from "./cart.service.js";

const CART_COOKIE = "cartSessionId";
const CART_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

function resolveOwner(req: AuthedRequest, res: Response): CartOwner {
  if (req.user) return { userId: req.user.id };

  let sessionId = req.cookies?.[CART_COOKIE];
  if (!sessionId) {
    sessionId = randomUUID();
    res.cookie(CART_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: CART_COOKIE_MAX_AGE_MS,
    });
  }
  return { sessionId };
}

export async function getCart(req: AuthedRequest, res: Response) {
  const cart = await getOrCreateCart(resolveOwner(req, res));
  res.json({ data: cart });
}

export async function addItem(req: AuthedRequest, res: Response) {
  const { productId, variantSku, qty } = req.body;
  const cart = await addItemToCart(resolveOwner(req, res), productId, qty, variantSku);
  res.status(201).json({ data: cart });
}

export async function updateItem(req: AuthedRequest, res: Response) {
  const cart = await updateCartItem(resolveOwner(req, res), req.params.itemId, req.body.qty);
  res.json({ data: cart });
}

export async function removeItem(req: AuthedRequest, res: Response) {
  const cart = await removeCartItem(resolveOwner(req, res), req.params.itemId);
  res.json({ data: cart });
}

export async function syncCart(req: AuthedRequest, res: Response) {
  const cart = await replaceCartItems(resolveOwner(req, res), req.body.items);
  res.json({ data: cart });
}
