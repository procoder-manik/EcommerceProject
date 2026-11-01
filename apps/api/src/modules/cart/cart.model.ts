import { Schema, model } from "mongoose";

export interface CartItem {
  productId: Schema.Types.ObjectId;
  variantSku?: string;
  qty: number;
  priceAtAdd: number;
}

export interface CartDoc {
  userId?: Schema.Types.ObjectId;
  sessionId?: string; // for guest carts
  items: CartItem[];
  expiresAt?: Date;
}

const cartSchema = new Schema<CartDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        variantSku: String,
        qty: Number,
        priceAtAdd: Number,
      },
    ],
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Guest carts expire automatically; logged-in carts leave expiresAt unset.
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Cart = model<CartDoc>("Cart", cartSchema);
