import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { stripe } from "../../config/stripe.js";
import type { AuthedRequest } from "../../middleware/auth.middleware.js";
import { createPaymentIntent, handlePaymentFailed, handlePaymentSucceeded } from "./payment.service.js";

export async function createIntent(req: AuthedRequest, res: Response) {
  const intent = await createPaymentIntent(req.body.orderId);
  res.json({ data: { clientSecret: intent.client_secret } });
}

// Mounted directly in app.ts with express.raw() so the exact bytes Stripe
// sent are available for signature verification — express.json() would
// have already re-serialized the body by the time it got here.
export async function webhook(req: Request, res: Response) {
  if (!stripe) return res.status(503).json({ error: { code: "PAYMENTS_DISABLED", message: "Stripe is not configured" } });
  const signature = req.headers["stripe-signature"] as string;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSucceeded(event.data.object as any);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object as any);
      break;
    default:
      break; // other event types are ignored on purpose
  }

  res.json({ received: true });
}
