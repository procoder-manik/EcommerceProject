"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

function PayForm({ orderId, onPaid }: { orderId: string; onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/${orderId}?new=1` },
      redirect: "if_required",
    });
    if (err) {
      setError(err.message ?? "Payment failed. Try another card.");
      setBusy(false);
    } else {
      onPaid();
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <PaymentElement />
      {error && (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      )}
      <button type="submit" disabled={!stripe || busy} className="btn w-full">
        {busy ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}

export default function StripePayment({ clientSecret, orderId, onPaid }: { clientSecret: string; orderId: string; onPaid: () => void }) {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(() => (key ? loadStripe(key) : null), [key]);

  if (!stripePromise) {
    return (
      <p role="alert" className="text-sm text-clay">
        The server is taking card payments, but NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing from apps/web/.env.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "flat", variables: { colorPrimary: "#A3432A", fontFamily: "inherit" } } }}>
      <PayForm orderId={orderId} onPaid={onPaid} />
    </Elements>
  );
}
