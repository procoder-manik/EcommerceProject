"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/site";

interface OrderRow {
  _id: string;
  status: string;
  createdAt: string;
  items: { qty: number }[];
  totals: { total: number };
}

export default function AccountPage() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) return router.replace("/login?next=/account");
    api<OrderRow[]>("/orders").then(setOrders).catch(() => setOrders([]));
  }, [ready, user, router]);

  if (!ready || !user) return <div className="wrap min-h-[60vh] pt-24" aria-busy />;

  return (
    <div className="wrap pb-8 pt-12 lg:pt-20">
      <p className="label">Account</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <h1 className="display text-6xl leading-none sm:text-8xl">Hello, {user.name.split(" ")[0]}.</h1>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="btn-ghost"
        >
          Sign out
        </button>
      </div>
      <p className="mt-4 text-ink-soft">
        {user.email}
        {user.role === "admin" && (
          <>
            {" · "}
            <a href="http://localhost:5173" className="link-u text-clay">
              Open admin panel
            </a>
          </>
        )}
      </p>

      <h2 className="display mt-20 text-4xl">Orders</h2>
      {orders === null ? (
        <p className="mt-6 text-ink-mute">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <p className="text-ink-soft">You haven&apos;t ordered anything yet.</p>
          <Link href="/products" className="btn mt-6">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/15">
          {orders.map((o) => (
            <li key={o._id}>
              <Link href={`/orders/${o._id}`} className="grid grid-cols-[1fr_auto] items-center gap-4 py-6 transition-colors duration-300 hover:text-clay sm:grid-cols-[1.2fr_1fr_1fr_auto]">
                <span className="font-mono text-sm uppercase tracking-[0.1em]">#{o._id.slice(-8)}</span>
                <span className="hidden text-sm text-ink-soft sm:block">
                  {new Date(o.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="hidden text-sm capitalize sm:block">{o.status}</span>
                <span className="text-right tabular-nums">{money(o.totals.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
