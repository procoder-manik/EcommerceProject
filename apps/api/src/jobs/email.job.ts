import { emailQueue } from "./queue.js";

export function enqueueOrderConfirmation(orderId: string, email: string) {
  return emailQueue.add("order-confirmation", { orderId, email });
}

export function enqueueShippingUpdate(orderId: string, email: string, trackingUrl?: string) {
  return emailQueue.add("shipping-update", { orderId, email, trackingUrl });
}

export function enqueuePasswordReset(email: string, token: string) {
  return emailQueue.add("password-reset", { email, token });
}
