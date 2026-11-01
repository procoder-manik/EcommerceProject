import { useCallback, useEffect, useState } from "react";
import { api, money, statusStyles } from "../lib/api";

type Status = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

interface Order {
  _id: string;
  status: Status;
  createdAt: string;
  items: { qty: number }[];
  totals: { total: number };
  shippingAddress?: { fullName?: string; city?: string };
}

const statuses: Status[] = ["pending", "paid", "shipped", "delivered", "cancelled"];
const tabs: { label: string; value: Status | "all" }[] = [{ label: "All", value: "all" }, ...statuses.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), value: s }))];

export default function Orders() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api<Order[]>(`/admin/orders?limit=100${filter === "all" ? "" : `&status=${filter}`}`)
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, [filter]);

  useEffect(load, [load]);

  async function setStatus(id: string, status: Status) {
    try {
      await api(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500">{orders ? `${orders.length} shown` : "Loading…"}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter orders by status">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={filter === t.value}
            onClick={() => setFilter(t.value)}
            className={`h-9 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
              filter === t.value ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(orders ?? []).map((o) => (
                <tr key={o._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">#{o._id.slice(-6)}</td>
                  <td className="px-5 py-3 text-slate-600">{o.shippingAddress?.fullName ?? "—"}{o.shippingAddress?.city ? `, ${o.shippingAddress.city}` : ""}</td>
                  <td className="px-5 py-3 text-slate-600">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-slate-600">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td className="px-5 py-3 text-slate-900">{money(o.totals.total)}</td>
                  <td className="px-5 py-3">
                    <label htmlFor={`s-${o._id}`} className="sr-only">Update status for order {o._id.slice(-6)}</label>
                    <select
                      id={`s-${o._id}`}
                      value={o.status}
                      onChange={(e) => setStatus(o._id, e.target.value as Status)}
                      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize focus:ring-2 focus:ring-brand-500 ${statusStyles[o.status]}`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {orders && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">No orders with this status.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
