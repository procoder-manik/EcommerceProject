import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const addCartItemSchema = z.object({
  productId: z.string(),
  variantSku: z.string().optional(),
  qty: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  qty: z.number().int().positive(),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  line1: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

export const variantInputSchema = z.object({
  sku: z.string().min(1),
  options: z.record(z.string()),
  stock: z.number().int().min(0),
  priceOverride: z.number().positive().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  images: z.array(z.string().url()).default([]),
  categoryId: z.string().optional(),
  variants: z.array(variantInputSchema).default([]),
  stock: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const updateUserRoleSchema = z.object({
  role: z.enum(["customer", "admin"]),
});

export const createPaymentIntentSchema = z.object({
  orderId: z.string(),
});

// Replaces the whole server-side cart with the client's current lines. Used
// at checkout so the browser cart (kept in localStorage) becomes the source
// of truth for the order — prices are still re-read from the database.
export const syncCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantSku: z.string().optional(),
        qty: z.number().int().positive().max(99),
      })
    )
    .max(100),
});
