import type { Request, Response } from "express";
import { createCategory, listCategories, updateCategory } from "./category.service.js";

export async function getCategories(_req: Request, res: Response) {
  const categories = await listCategories();
  res.json({ data: categories });
}

export async function postCategory(req: Request, res: Response) {
  const category = await createCategory(req.body);
  res.status(201).json({ data: category });
}

export async function patchCategory(req: Request, res: Response) {
  const category = await updateCategory(req.params.id, req.body);
  if (!category) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Category not found" } });
  res.json({ data: category });
}
