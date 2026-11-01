"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/site";

interface Order {
  _id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  items: { name: string; price: number; qty: number }[];
  totals: { subtotal: number; tax: number; shipping: number; total: number };
  shippingAddress: Record<string, string>;
  timeline: { status: string; at: string }[];
  createdAt: string;
}

const steps = ["pending", "paid", "shipped", "delivered"] as const;

function OrderView() {
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const { user, ready } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) return router.replace(`/login?next=/orders/${id}`);
    let tries = 0;
    let timer: number;
    const load = async () => {
      try {
        const o = await api<Order>(`/orders/${id}`);
        setOrder(o);
        // After a card payment the webhook flips the order to "paid" a moment later.
        if (o.status === "pending" && tries++ < 8) timer = window.setTimeout(load, 1500);
      } catch (e: any) {
        setError(e.message);
      }
    };
    load();
    return () => window.clearTimeout(timer);
  }, [ready, user, id, router]);

  if (error)
    return (
      <div className="wrap py-24">
        <p className="display text-4xl">We couldn&apos;t find that order.</p>
        <Link href="/account" className="btn mt-8">
          Your orders
        </Link>
      </div>
    );
  if (!order) return <div className="wrap min-h-[60vh] pt-24" aria-busy />;

  const reached = steps.indexOf(order.status as (typeof steps)[number]);
  const a = order.shippingAddress;

  return (
    <div className="wrap pb-8 pt-12 lg:pt-20">
      <p className="label">{isNew ? "Order placed" : "Order"} · #{order._id.slice(-8)}</p>
      <h1 className="display mt-3 text-6xl leading-none sm:text-8xl">
        {isNew ? (
          <>
            Thank <em className="italic text-clay">you.</em>
          </>
        ) : (
          "Your order"
        )}
      </h1>
      {isNew && <p className="mt-5 max-w-lg text-ink-soft">We&apos;ve received your order and will email you when it ships.</p>}

      {order.status === "cancelled" ? (
        <p className="mt-12 font-mono text-sm uppercase tracking-[0.14em] text-clay">Cancelled</p>
      ) : (
        <ol className="mt-14 grid grid-cols-4 gap-2" aria-label="Order progress">
          {steps.map((s, i) => (
            <li key={s}>
              <div className={`h-px ${i <= reached ? "bg-clay" : "bg-ink/20"}`} />
              <p className={`mt-3 font-mono text-[11px] uppercase tracking-[0.14em] ${i <= reached ? "text-ink" : "text-ink-mute"}`}>{s}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-16 grid gap-14 lg:grid-cols-12">
        <ul className="divide-y divide-ink/15 border-y border-ink/15 lg:col-span-8">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4 py-5">
              <span className="display text-xl">
                {it.name} <span className="font-mono text-xs text-ink-mute">× {it.qty}</span>
              </span>
              <span className="tabular-nums">{money(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <aside className="space-y-8 lg:col-span-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular-nums">{money(order.totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="tabular-nums">{order.totals.shipping === 0 ? "Free" : money(order.totals.shipping)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd className="tabular-nums">{money(order.totals.tax)}</dd></div>
            <div className="flex items-baseline justify-between border-t border-ink/20 pt-3">
              <dt className="label">Total</dt>
              <dd className="display text-3xl tabular-nums">{money(order.totals.total)}</dd>
            </div>
          </dl>
          <div>
            <p className="label">Ships to</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {a.fullName && <>{a.fullName}<br /></>}
              {a.line1}<br />
              {a.city} {a.postalCode}<br />
              {a.country}
            </p>
          </div>
        </aside>
      </div>
      <Link href="/products" className="btn-ghost mt-16">
        Continue shopping
      </Link>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="wrap min-h-[60vh] pt-24" aria-busy />}>
      <OrderView />
    </Suspense>
  );
}
