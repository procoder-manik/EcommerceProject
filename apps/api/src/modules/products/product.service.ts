import { Product, type ProductDoc } from "./product.model.js";

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export async function listProducts(filters: ProductFilters) {
  const page = Number(filters.page ?? 1);
  const limit = Number(filters.limit ?? 20);
  const query: Record<string, unknown> = { isActive: true };

  if (filters.category) query.categoryId = filters.category;
  if (filters.minPrice || filters.maxPrice) {
    query.price = {
      ...(filters.minPrice ? { $gte: Number(filters.minPrice) } : {}),
      ...(filters.maxPrice ? { $lte: Number(filters.maxPrice) } : {}),
    };
  }
  if (filters.search) query.$text = { $search: filters.search };

  const [data, totalItems] = await Promise.all([
    Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return { data, meta: { page, totalPages: Math.ceil(totalItems / limit), totalItems } };
}

export function getProductBySlug(slug: string) {
  return Product.findOne({ slug, isActive: true });
}

export function createProduct(data: Partial<ProductDoc>) {
  return Product.create(data);
}

export function updateProduct(id: string, data: Partial<ProductDoc>) {
  return Product.findByIdAndUpdate(id, data, { new: true });
}

// Soft delete — keeps the product (and its order history references)
// around but off the storefront, rather than destroying the row.
export function deactivateProduct(id: string) {
  return Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
}
