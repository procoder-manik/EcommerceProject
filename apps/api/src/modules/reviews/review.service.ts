import { Order } from "../orders/order.model.js";
import { Product } from "../products/product.model.js";
import { Review } from "./review.model.js";

function httpError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), { status, code });
}

export function listReviewsForProduct(productId: string, page = 1, limit = 20) {
  return Promise.all([
    Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name"),
    Review.countDocuments({ productId }),
  ]);
}

// One review per purchase, enforced at the model layer too (unique index
// on productId+userId) — this check gives a clear error message instead
// of a raw duplicate-key error.
export async function createReview(userId: string, productId: string, rating: number, comment: string) {
  const purchased = await Order.exists({
    userId,
    "items.productId": productId,
    status: { $in: ["paid", "shipped", "delivered"] },
  });
  if (!purchased) throw httpError(403, "NOT_PURCHASED", "You can only review products you've purchased");

  const existing = await Review.findOne({ productId, userId });
  if (existing) throw httpError(409, "ALREADY_REVIEWED", "You've already reviewed this product");

  const review = await Review.create({ productId, userId, rating, comment });

  const [agg] = await Review.aggregate([
    { $match: { productId: review.productId } },
    { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    ratingAvg: Number((agg?.avg ?? rating).toFixed(2)),
    ratingCount: agg?.count ?? 1,
  });

  return review;
}
