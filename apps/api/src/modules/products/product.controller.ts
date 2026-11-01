import type { Request, Response } from "express";
import { createProduct, deactivateProduct, getProductBySlug, listProducts, updateProduct } from "./product.service.js";

export async function getProducts(req: Request, res: Response) {
  const result = await listProducts(req.query as any);
  res.json(result);
}

export async function getProduct(req: Request, res: Response) {
  const product = await getProductBySlug(req.params.slug);
  if (!product) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } });
  res.json({ data: product });
}

export async function postProduct(req: Request, res: Response) {
  const product = await createProduct(req.body);
  res.status(201).json({ data: product });
}

export async function patchProduct(req: Request, res: Response) {
  const product = await updateProduct(req.params.id, req.body);
  if (!product) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } });
  res.json({ data: product });
}

export async function deleteProduct(req: Request, res: Response) {
  const product = await deactivateProduct(req.params.id);
  if (!product) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } });
  res.status(204).send();
}
