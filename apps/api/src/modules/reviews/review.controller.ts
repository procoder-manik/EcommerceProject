import type { Response } from "express";
import type { AuthedRequest } from "../../middleware/auth.middleware.js";
import { createReview, listReviewsForProduct } from "./review.service.js";

export async function getReviews(req: AuthedRequest, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const [data, totalItems] = await listReviewsForProduct(req.params.id, page, limit);
  res.json({ data, meta: { page, totalPages: Math.ceil(totalItems / limit), totalItems } });
}

export async function postReview(req: AuthedRequest, res: Response) {
  const { rating, comment } = req.body;
  const review = await createReview(req.user!.id, req.params.id, rating, comment);
  res.status(201).json({ data: review });
}
