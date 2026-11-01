import type { Response } from "express";
import type { AuthedRequest } from "../../middleware/auth.middleware.js";
import {
  createOrderFromCart,
  getOrderForUser,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
} from "./order.service.js";
import type { OrderStatus } from "./order.model.js";

export async function createOrder(req: AuthedRequest, res: Response) {
  const result = await createOrderFromCart(req.user!.id, req.body.shippingAddress);
  res.status(201).json({ data: result });
}

export async function getMyOrders(req: AuthedRequest, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const [data, totalItems] = await listOrdersForUser(req.user!.id, page, limit);
  res.json({ data, meta: { page, totalPages: Math.ceil(totalItems / limit), totalItems } });
}

export async function getOrder(req: AuthedRequest, res: Response) {
  const order = await getOrderForUser(req.user!.id, req.params.id);
  if (!order) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Order not found" } });
  res.json({ data: order });
}

export async function getAllOrders(req: AuthedRequest, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as OrderStatus | undefined;
  const [data, totalItems] = await listAllOrders(page, limit, status);
  res.json({ data, meta: { page, totalPages: Math.ceil(totalItems / limit), totalItems } });
}

export async function patchOrderStatus(req: AuthedRequest, res: Response) {
  const order = await updateOrderStatus(req.params.id, req.body.status);
  res.json({ data: order });
}
