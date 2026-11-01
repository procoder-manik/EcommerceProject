import { Schema, model } from "mongoose";

export interface ProductVariant {
  sku: string;
  options: Record<string, string>; // e.g. { size: "M", color: "Black" }
  stock: number;
  priceOverride?: number;
}

export interface ProductDoc {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  categoryId: Schema.Types.ObjectId;
  variants: ProductVariant[];
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
}

const productSchema = new Schema<ProductDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: Number,
    images: [String],
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    variants: [
      {
        sku: String,
        options: Schema.Types.Mixed,
        stock: Number,
        priceOverride: Number,
      },
    ],
    stock: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

export const Product = model<ProductDoc>("Product", productSchema);
