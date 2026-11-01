import { useCallback, useEffect, useState } from "react";
import { SearchIcon } from "../components/icons";
import { api, money } from "../lib/api";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  categoryId?: string;
}

interface Category {
  _id: string;
  name: string;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function Products() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Product[]>("/products?limit=100").then(setProducts).catch((e) => setError(e.message));
    api<Category[]>("/categories").then(setCategories).catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  const filtered = (products ?? []).filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const catName = (id?: string) => categories.find((c) => c._id === id)?.name ?? "—";

  async function remove(p: Product) {
    if (!window.confirm(`Hide "${p.name}" from the storefront? (It is deactivated, not erased.)`)) return;
    try {
      await api(`/products/${p._id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{products ? `${products.length} active products` : "Loading…"}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-700"
        >
          Add product
        </button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <input
          id="product-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500"
        />
      </div>

      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 flex-none overflow-hidden rounded-lg bg-slate-100">
                        {p.images[0] && (
                          <img
                            src={p.images[0].startsWith("/") ? `http://localhost:3000${p.images[0]}` : p.images[0]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{catName(p.categoryId)}</td>
                  <td className="px-5 py-3 text-slate-900">{money(p.price)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.stock <= 0 ? "bg-rose-50 text-rose-700" : p.stock < 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {p.stock <= 0 ? "Out of stock" : `${p.stock} in stock`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => setEditing(p)} className="mr-4 cursor-pointer text-sm font-medium text-brand-700 hover:underline">Edit</button>
                    <button type="button" onClick={() => remove(p)} className="cursor-pointer text-sm font-medium text-rose-600 hover:underline">Hide</button>
                  </td>
                </tr>
              ))}
              {products && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No products match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name"));
    const image = String(f.get("image") ?? "").trim();
    const compare = String(f.get("compareAtPrice") ?? "").trim();
    const body: Record<string, unknown> = {
      name,
      slug: product?.slug ?? (slugify(name) || "product"),
      description: String(f.get("description")),
      price: Number(f.get("price")),
      stock: Number(f.get("stock")),
      categoryId: String(f.get("categoryId")) || undefined,
    };
    if (compare) body.compareAtPrice = Number(compare);
    if (image) body.images = [image];
    setBusy(true);
    setError(null);
    try {
      if (product) await api(`/products/${product._id}`, { method: "PATCH", body: JSON.stringify(body) });
      else await api("/products", { method: "POST", body: JSON.stringify(body) });
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={product ? "Edit product" : "Add product"}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-pointer bg-slate-900/50" />
      <form onSubmit={submit} className="relative max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{product ? "Edit product" : "Add product"}</h2>
        <div>
          <label htmlFor="pf-name" className="text-sm font-medium text-slate-700">Name</label>
          <input id="pf-name" name="name" required defaultValue={product?.name} className={input} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="pf-price" className="text-sm font-medium text-slate-700">Price</label>
            <input id="pf-price" name="price" type="number" step="0.01" min="0.01" required defaultValue={product?.price} className={input} />
          </div>
          <div>
            <label htmlFor="pf-compare" className="text-sm font-medium text-slate-700">Compare at</label>
            <input id="pf-compare" name="compareAtPrice" type="number" step="0.01" min="0.01" defaultValue={product?.compareAtPrice} className={input} />
          </div>
          <div>
            <label htmlFor="pf-stock" className="text-sm font-medium text-slate-700">Stock</label>
            <input id="pf-stock" name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 0} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="pf-cat" className="text-sm font-medium text-slate-700">Category</label>
          <select id="pf-cat" name="categoryId" defaultValue={product?.categoryId ?? ""} className={input}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-img" className="text-sm font-medium text-slate-700">Image URL</label>
          <input id="pf-img" name="image" type="url" placeholder="https://…" className={input} />
          {product && <p className="mt-1 text-xs text-slate-500">Leave empty to keep the current images.</p>}
        </div>
        <div>
          <label htmlFor="pf-desc" className="text-sm font-medium text-slate-700">Description</label>
          <textarea id="pf-desc" name="description" required rows={4} defaultValue={product?.description} className={`${input} h-auto py-2`} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="h-10 cursor-pointer rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={busy} className="h-10 cursor-pointer rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
