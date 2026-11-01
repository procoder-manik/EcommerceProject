import { stripe } from "../../config/stripe.js";
import { enqueueOrderConfirmation } from "../../jobs/email.job.js";
import { Order } from "../orders/order.model.js";
import { Product } from "../products/product.model.js";
import { User } from "../users/user.model.js";
import { Payment } from "./payment.model.js";

function httpError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), { status, code });
}

export async function createPaymentIntent(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw httpError(404, "NOT_FOUND", "Order not found");

  if (!stripe) throw httpError(503, "PAYMENTS_DISABLED", "Stripe is not configured");

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(order.totals.total * 100),
    currency: "usd",
    metadata: { orderId: String(order.id) },
  });

  order.paymentIntentId = intent.id;
  await order.save();
  return intent;
}

export interface StripeIntentLike {
  id: string;
  amount: number;
  metadata: Record<string, string>;
}

// Order status changes ONLY happen here or through an explicit admin
// action — never from the client's "success" redirect, which a user could
// hit without ever actually paying. Stripe retries webhooks, so this is
// guarded to be idempotent on providerPaymentId.
export async function handlePaymentSucceeded(intent: StripeIntentLike) {
  const already = await Payment.findOne({ providerPaymentId: intent.id });
  if (already) return;

  const order = await Order.findById(intent.metadata.orderId);
  if (!order) return;

  await Payment.create({
    orderId: order.id,
    provider: "stripe",
    providerPaymentId: intent.id,
    amount: intent.amount / 100,
    status: "succeeded",
  });

  order.status = "paid";
  order.timeline.push({ status: "paid", at: new Date() });
  await order.save();

  // NOTE: this decrements the product's top-level stock only. If a
  // specific variant's stock needs to be tracked separately, store
  // variantSku on the order line item (order.model.ts) and decrement
  // Product.variants.$[v].stock instead.
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
  }

  const user = await User.findById(order.userId);
  if (user?.email) await enqueueOrderConfirmation(String(order.id), user.email);
}

export async function handlePaymentFailed(intent: StripeIntentLike) {
  const order = await Order.findById(intent.metadata.orderId);
  if (!order || order.status !== "pending") return;

  const already = await Payment.findOne({ providerPaymentId: intent.id });
  if (already) return;

  await Payment.create({
    orderId: order.id,
    provider: "stripe",
    providerPaymentId: intent.id,
    amount: intent.amount / 100,
    status: "failed",
  });
}
