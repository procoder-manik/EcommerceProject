import { useEffect, useState } from "react";
import { BagIcon, DollarIcon, UsersIcon } from "../components/icons";
import { api, money, statusStyles } from "../lib/api";

interface Order {
  _id: string;
  status: string;
  createdAt: string;
  items: { qty: number }[];
  totals: { total: number };
  shippingAddress?: { fullName?: string };
}

const REVENUE = ["paid", "shipped", "delivered"];

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [customers, setCustomers] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Order[]>("/admin/orders?limit=100").then(setOrders).catch((e) => setError(e.message));
    api<unknown[]>("/users?limit=100").then((u) => setCustomers(u.length)).catch(() => setCustomers(null));
  }, []);

  if (error) return <p role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;
  if (!orders) return <p className="text-sm text-slate-500">Loading…</p>;

  const revenueOrders = orders.filter((o) => REVENUE.includes(o.status));
  const revenue = revenueOrders.reduce((n, o) => n + o.totals.total, 0);
  const avg = revenueOrders.length ? revenue / revenueOrders.length : 0;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const daily = days.map((d) => {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return revenueOrders.filter((o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < next).reduce((n, o) => n + o.totals.total, 0);
  });
  const max = Math.max(...daily, 1);

  const cards = [
    { label: "Revenue", value: money(revenue), icon: DollarIcon },
    { label: "Orders", value: String(orders.length), icon: BagIcon },
    { label: "Customers", value: customers === null ? "—" : String(customers), icon: UsersIcon },
    { label: "Avg. order value", value: money(avg), icon: DollarIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Live numbers from your store. Revenue counts paid, shipped and delivered orders.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{c.label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <c.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Revenue, last 7 days</h2>
          <span className="text-xs text-slate-500">{money(daily.reduce((a, b) => a + b, 0))}</span>
        </div>
        <div className="mt-6 flex h-40 items-end gap-3" role="img" aria-label={`Daily revenue for the last 7 days: ${daily.map((v) => money(v)).join(", ")}`}>
          {daily.map((v, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="w-full rounded-t-md bg-brand-500/80" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} title={money(v)} />
              <span className="text-[11px] text-slate-400">{days[i].toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 6).map((o) => (
                <tr key={o._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">#{o._id.slice(-6)}</td>
                  <td className="px-5 py-3 text-slate-600">{o.shippingAddress?.fullName ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-slate-900">{money(o.totals.total)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[o.status]}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
