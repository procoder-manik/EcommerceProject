"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/catalog";
import { money } from "@/lib/site";
import { Minus, Plus } from "./icons";

export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [sku, setSku] = useState(firstAvailable?.sku);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.sku === sku);
  const soldOut = product.variants.length ? !variant || variant.stock <= 0 : product.stock <= 0;
  const maxQty = Math.max(1, Math.min(10, variant?.stock ?? product.stock));

  function handleAdd() {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        sku: variant?.sku,
        variantLabel: product.variantLabel,
        variantValue: variant?.label,
      },
      qty
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      {product.variants.length > 0 && (
        <fieldset>
          <legend className="label mb-3">
            {product.variantLabel}: <span className="text-ink">{variant?.label}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const active = v.sku === sku;
              const out = v.stock <= 0;
              return (
                <button
                  key={v.sku}
                  type="button"
                  disabled={out}
                  aria-pressed={active}
                  onClick={() => {
                    setSku(v.sku);
                    setQty(1);
                  }}
                  className={`min-h-[44px] cursor-pointer border px-5 text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:text-ink-mute disabled:line-through ${
                    active ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex items-stretch gap-3">
        <div className="flex items-center border border-ink/25">
          <button
            type="button"
            className="flex h-full min-h-[48px] w-11 cursor-pointer items-center justify-center"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus width={16} height={16} />
          </button>
          <span className="w-9 text-center tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className="flex h-full min-h-[48px] w-11 cursor-pointer items-center justify-center"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            aria-label="Increase quantity"
          >
            <Plus width={16} height={16} />
          </button>
        </div>
        <button type="button" onClick={handleAdd} disabled={soldOut} className="btn flex-1">
          {soldOut ? "Sold out" : added ? "Added to bag" : `Add to bag — ${money(product.price * qty)}`}
        </button>
      </div>
      {!soldOut && variant && variant.stock <= 5 && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-clay">Only {variant.stock} left</p>
      )}
    </div>
  );
}
