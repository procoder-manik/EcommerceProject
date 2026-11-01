import Stripe from "stripe";
import { env } from "./env.js";

// null in development when STRIPE_SECRET_KEY isn't set — callers must handle it.
export const stripe: Stripe | null = env.stripe.secretKey
  ? new Stripe(env.stripe.secretKey, { apiVersion: "2024-06-20" })
  : null;
