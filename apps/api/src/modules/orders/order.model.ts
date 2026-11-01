import { Schema, model } from "mongoose";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderItemSnapshot {
  productId: Schema.Types.ObjectId;
  name: string;
  price: number; // price at time of purchase — never re-read from the live product
  qty: number;
}

export interface OrderDoc {
  userId: Schema.Types.ObjectId;
  items: OrderItemSnapshot[];
  shippingAddress: Record<string, string>;
  status: OrderStatus;
  paymentIntentId?: string;
  totals: { subtotal: number; tax: number; shipping: number; total: number };
  timeline: { status: OrderStatus; at: Date }[];
}

const orderSchema = new Schema<OrderDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        qty: Number,
      },
    ],
    shippingAddress: Schema.Types.Mixed,
    status: { type: String, enum: ["pending", "paid", "shipped", "delivered", "cancelled"], default: "pending" },
    paymentIntentId: String,
    totals: { subtotal: Number, tax: Number, shipping: Number, total: Number },
    timeline: [{ status: String, at: Date }],
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });

export const Order = model<OrderDoc>("Order", orderSchema);
