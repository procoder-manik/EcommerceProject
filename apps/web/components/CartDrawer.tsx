"use client";

import Link from "next/link";
import { useEffect } from "react";
import { lineKey, useCart } from "@/lib/cart";
import { money, site } from "@/lib/site";
import { Close, Minus, Plus } from "./icons";
import Pic from "./Pic";

export default function CartDrawer() {
  const { open, setOpen, lines, subtotal, setQty, remove } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;

  const remaining = Math.max(0, site.freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Your bag">
      <button
        type="button"
        aria-label="Close bag"
        className="absolute inset-0 cursor-pointer bg-ink/50"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-paper shadow-2xl">
        <div className="flex h-[68px] items-center justify-between border-b border-ink/10 px-6">
          <h2 className="display text-2xl">Your bag</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center"
            aria-label="Close bag"
          >
            <Close width={22} height={22} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-6 px-6">
            <p className="display text-3xl leading-tight">Nothing here yet.</p>
            <Link href="/products" onClick={() => setOpen(false)} className="btn">
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <div className="px-6 pt-5">
              <p className="text-sm text-ink-soft">
                {remaining > 0 ? (
                  <>
                    You&apos;re <strong className="font-medium text-ink">{money(remaining)}</strong> away from free shipping.
                  </>
                ) : (
                  "Free shipping unlocked."
                )}
              </p>
              <div className="mt-2 h-px w-full bg-ink/15">
                <div
                  className="h-px bg-clay transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.min(100, (subtotal / site.freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
              {lines.map((l) => {
                const key = lineKey(l);
                return (
                  <li key={key} className="flex gap-4 py-5">
                    <div className="relative h-28 w-24 flex-none overflow-hidden bg-paper-deep">
                      <Pic src={l.image} alt={l.name} sizes="96px" className="object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="display text-lg leading-tight">
                          {l.name}
                        </Link>
                        <span className="text-sm tabular-nums">{money(l.price * l.qty)}</span>
                      </div>
                      {l.variantValue && (
                        <p className="label mt-1">
                          {l.variantLabel}: {l.variantValue}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-ink/25">
                          <button
                            type="button"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center"
                            onClick={() => setQty(key, l.qty - 1)}
                            aria-label={`Decrease quantity of ${l.name}`}
                          >
                            <Minus width={14} height={14} />
                          </button>
                          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                            {l.qty}
                          </span>
                          <button
                            type="button"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center"
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
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-ink/10 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="label">Subtotal</span>
                <span className="display text-2xl tabular-nums">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-mute">Shipping and tax are calculated at checkout.</p>
              <div className="mt-4 grid gap-3">
                <Link href="/checkout" onClick={() => setOpen(false)} className="btn w-full">
                  Checkout
                </Link>
                <Link href="/cart" onClick={() => setOpen(false)} className="btn-ghost w-full">
                  View bag
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
