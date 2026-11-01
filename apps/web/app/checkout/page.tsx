"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Pic from "@/components/Pic";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { lineKey, useCart } from "@/lib/cart";
import { money, site } from "@/lib/site";

const StripePayment = dynamic(() => import("@/components/StripePayment"), { ssr: false });

const isMongoId = (s: string) => /^[a-f0-9]{24}$/i.test(s);

export default function CheckoutPage() {
  const { user, ready: authReady } = useAuth();
  const { lines, ready, subtotal, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pay, setPay] = useState<{ orderId: string; clientSecret: string } | null>(null);

  const shipping = subtotal >= site.freeShippingThreshold ? 0 : site.flatShipping;
  const tax = Number((subtotal * site.taxRate).toFixed(2));
  const total = subtotal + shipping + tax;

  if (!ready || !authReady) return <div className="wrap min-h-[60vh] pt-24" aria-busy />;

  if (lines.length === 0 && !pay) {
    return (
      <div className="wrap flex min-h-[60vh] flex-col items-start justify-center gap-8 py-24">
        <h1 className="display text-6xl sm:text-7xl">Your bag is empty.</h1>
        <Link href="/products" className="btn">
          Browse the shop
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="wrap flex min-h-[60vh] flex-col items-start justify-center gap-6 py-24">
        <p className="label">Checkout</p>
        <h1 className="display max-w-2xl text-5xl leading-tight sm:text-7xl">Sign in to place your order.</h1>
        <p className="max-w-md text-ink-soft">Your bag is saved. Sign in or create an account and you&apos;ll come straight back here.</p>
        <div className="flex gap-4">
          <Link href="/login?next=/checkout" className="btn">
            Sign in
          </Link>
          <Link href="/register?next=/checkout" className="btn-ghost">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      if (lines.some((l) => !isMongoId(l.productId))) {
        throw new Error("The store catalog is offline, so orders can't be placed right now. Start the API and refresh.");
      }
      await api("/cart", {
        method: "PUT",
        body: JSON.stringify({ items: lines.map((l) => ({ productId: l.productId, variantSku: l.sku, qty: l.qty })) }),
      });
      const res = await api<{ order: { _id: string }; clientSecret: string | null }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: {
            fullName: f.get("fullName"),
            phone: f.get("phone") || undefined,
            line1: f.get("line1"),
            city: f.get("city"),
            postalCode: f.get("postalCode"),
            country: f.get("country"),
          },
        }),
      });
      if (res.clientSecret) {
        setPay({ orderId: res.order._id, clientSecret: res.clientSecret });
      } else {
        clear();
        router.push(`/orders/${res.order._id}?new=1`);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong placing your order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap pb-8 pt-12 lg:pt-20">
      <p className="label">Checkout</p>
      <h1 className="display mt-3 text-6xl leading-none sm:text-8xl">{pay ? "Payment" : "Delivery"}</h1>

      <div className="mt-14 grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {pay ? (
            <StripePayment
              clientSecret={pay.clientSecret}
              orderId={pay.orderId}
              onPaid={() => {
                clear();
                router.push(`/orders/${pay.orderId}?new=1`);
              }}
            />
          ) : (
            <form onSubmit={submit} className="grid gap-8">
              <div>
                <p className="label">Contact</p>
                <p className="mt-2">{user.email}</p>
              </div>
              <div className="grid gap-7 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="label">Full name</label>
                  <input id="fullName" name="fullName" required autoComplete="name" defaultValue={user.name} className="field" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="line1" className="label">Address</label>
                  <input id="line1" name="line1" required autoComplete="address-line1" className="field" />
                </div>
                <div>
                  <label htmlFor="city" className="label">City</label>
                  <input id="city" name="city" required autoComplete="address-level2" className="field" />
                </div>
                <div>
                  <label htmlFor="postalCode" className="label">Postal code</label>
                  <input id="postalCode" name="postalCode" required autoComplete="postal-code" className="field" />
                </div>
                <div>
                  <label htmlFor="country" className="label">Country</label>
                  <input id="country" name="country" required autoComplete="country-name" defaultValue="United States" className="field" />
                </div>
                <div>
                  <label htmlFor="phone" className="label">Phone (optional)</label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" />
                </div>
              </div>
              {error && (
                <p role="alert" className="border-l-2 border-clay bg-clay-wash/50 px-4 py-3 text-sm text-clay-deep">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn w-full sm:w-fit">
                {busy ? "Placing order…" : `Place order — ${money(total)}`}
              </button>
              <p className="text-xs text-ink-mute">
                Totals are recalculated on our server from current prices when you place the order.
              </p>
            </form>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-paper-deep p-7 lg:sticky lg:top-32">
            <h2 className="display text-3xl">In your bag</h2>
            <ul className="mt-6 divide-y divide-ink/15">
              {lines.map((l) => (
                <li key={lineKey(l)} className="flex gap-4 py-4">
                  <div className="relative h-20 w-16 flex-none bg-paper">
                    <Pic src={l.image} alt={l.name} sizes="64px" className="object-cover" />
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 font-mono text-[10px] text-paper">
                      {l.qty}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="display leading-tight">{l.name}</p>
                    {l.variantValue && <p className="label mt-0.5">{l.variantValue}</p>}
                  </div>
                  <p className="text-sm tabular-nums">{money(l.price * l.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-ink/20 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="tabular-nums">{shipping === 0 ? "Free" : money(shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd className="tabular-nums">{money(tax)}</dd></div>
              <div className="flex items-baseline justify-between border-t border-ink/20 pt-4">
                <dt className="label">Total</dt>
                <dd className="display text-3xl tabular-nums">{money(total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
