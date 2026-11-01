"use client";

import Link from "next/link";
import Pic from "@/components/Pic";
import { Minus, Plus } from "@/components/icons";
import { lineKey, useCart } from "@/lib/cart";
import { money, site } from "@/lib/site";

export default function CartPage() {
  const { lines, ready, subtotal, setQty, remove } = useCart();

  const shipping = subtotal === 0 || subtotal >= site.freeShippingThreshold ? 0 : site.flatShipping;
  const tax = Number((subtotal * site.taxRate).toFixed(2));
  const total = subtotal + shipping + tax;
  const remaining = Math.max(0, site.freeShippingThreshold - subtotal);

  if (!ready) return <div className="wrap min-h-[60vh] pt-24" aria-busy />;

  if (lines.length === 0) {
    return (
      <div className="wrap flex min-h-[60vh] flex-col items-start justify-center gap-8 py-24">
        <p className="label">Your bag</p>
        <h1 className="display text-6xl leading-none sm:text-8xl">
          Quite <em className="italic text-clay">empty.</em>
        </h1>
        <Link href="/products" className="btn">
          Start browsing
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap pb-8 pt-12 lg:pt-20">
      <p className="label">Your bag — {lines.length} {lines.length === 1 ? "item" : "items"}</p>
      <h1 className="display mt-3 text-6xl leading-none sm:text-8xl">Bag</h1>

      <div className="mt-14 grid gap-14 lg:grid-cols-12">
        <ul className="divide-y divide-ink/15 border-y border-ink/15 lg:col-span-8">
          {lines.map((l) => {
            const key = lineKey(l);
            return (
              <li key={key} className="grid grid-cols-[96px_1fr] gap-5 py-6 sm:grid-cols-[132px_1fr_auto]">
                <Link href={`/products/${l.slug}`} className="relative block aspect-[4/5] bg-paper-deep">
                  <Pic src={l.image} alt={l.name} sizes="132px" className="object-cover" />
                </Link>
                <div className="flex flex-col">
                  <Link href={`/products/${l.slug}`} className="display text-2xl leading-tight">
                    {l.name}
                  </Link>
                  {l.variantValue && (
                    <p className="label mt-1">
                      {l.variantLabel}: {l.variantValue}
                    </p>
                  )}
                  <p className="mt-2 text-sm tabular-nums text-ink-soft">{money(l.price)} each</p>
                  <div className="mt-auto flex items-center gap-5 pt-4">
                    <div className="flex items-center border border-ink/25">
                      <button
                        type="button"
                        className="flex h-10 w-10 cursor-pointer items-center justify-center"
                        onClick={() => setQty(key, l.qty - 1)}
                        aria-label={`Decrease quantity of ${l.name}`}
                      >
                        <Minus width={14} height={14} />
                      </button>
                      <span className="w-9 text-center tabular-nums" aria-live="polite">
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        className="flex h-10 w-10 cursor-pointer items-center justify-center"
                        onClick={() => setQty(key, l.qty + 1)}
                        aria-label={`Increase quantity of ${l.name}`}
                      >
                        <Plus width={14} height={14} />
                      </button>
                    </div>
                    <button type="button" onClick={() => remove(key)} className="link-u text-xs uppercase tracking-[0.12em] text-ink-mute">
                      Remove
                    </button>
                  </div>
                </div>
                <p className="col-span-2 text-right tabular-nums sm:col-span-1">{money(l.price * l.qty)}</p>
              </li>
            );
          })}
        </ul>

        <aside className="lg:col-span-4">
          <div className="bg-paper-deep p-7 lg:sticky lg:top-32">
            <h2 className="display text-3xl">Summary</h2>
            <p className="mt-4 text-sm text-ink-soft">
              {remaining > 0 ? `Add ${money(remaining)} more for free shipping.` : "You've unlocked free shipping."}
            </p>
            <div className="mt-2 h-px bg-ink/15">
              <div
                className="h-px bg-clay transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(100, (subtotal / site.freeShippingThreshold) * 100)}%` }}
              />
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="tabular-nums">{shipping === 0 ? "Free" : money(shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Estimated tax</dt>
                <dd className="tabular-nums">{money(tax)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink/20 pt-4">
                <dt className="label">Total</dt>
                <dd className="display text-3xl tabular-nums">{money(total)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn mt-7 w-full">
              Checkout
            </Link>
            <Link href="/products" className="link-u mt-5 block text-center text-xs uppercase tracking-[0.12em] text-ink-mute">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
