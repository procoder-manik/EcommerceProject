import { Schema, model } from "mongoose";

export interface PaymentDoc {
  orderId: Schema.Types.ObjectId;
  provider: "stripe";
  providerPaymentId: string;
  amount: number;
  status: "requires_payment" | "succeeded" | "failed" | "refunded";
  rawWebhookPayload?: Record<string, unknown>;
}

const paymentSchema = new Schema<PaymentDoc>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    provider: { type: String, default: "stripe" },
    providerPaymentId: { type: String, required: true, unique: true }, // enforces webhook idempotency
    amount: { type: Number, required: true },
    status: { type: String, enum: ["requires_payment", "succeeded", "failed", "refunded"], default: "requires_payment" },
    rawWebhookPayload: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Payment = model<PaymentDoc>("Payment", paymentSchema);
