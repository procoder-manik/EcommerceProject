import type { Response } from "express";
import type { AuthedRequest } from "../../middleware/auth.middleware.js";
import { findUserById, listUsers, updateUserProfile, updateUserRole } from "./user.service.js";

export async function getMe(req: AuthedRequest, res: Response) {
  const user = await findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
  res.json({ data: user });
}

export async function updateMe(req: AuthedRequest, res: Response) {
  const user = await updateUserProfile(req.user!.id, req.body);
  res.json({ data: user });
}

export async function getUsers(req: AuthedRequest, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const [data, totalItems] = await listUsers(page, limit);
  res.json({ data, meta: { page, totalPages: Math.ceil(totalItems / limit), totalItems } });
}

export async function patchUserRole(req: AuthedRequest, res: Response) {
  const user = await updateUserRole(req.params.id, req.body.role);
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
  res.json({ data: user });
}
