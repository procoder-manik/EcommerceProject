import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts, type ProductQuery } from "@/lib/catalog";

export const metadata: Metadata = { title: "All objects" };
export const dynamic = "force-dynamic";

const sorts: { value: NonNullable<ProductQuery["sort"]>; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "rating", label: "Top rated" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; sort?: ProductQuery["sort"] };
}) {
  const category = searchParams.category ?? "all";
  const sort = searchParams.sort ?? "featured";
  const q = searchParams.q?.trim();
  const [categories, { products }] = await Promise.all([getCategories(), getProducts({ category, sort, q })]);

  const href = (over: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category: category === "all" ? undefined : category, sort: sort === "featured" ? undefined : sort, q, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  };

  const title = categories.find((c) => c.slug === category)?.name ?? "All objects";

  return (
    <div className="wrap pb-8 pt-12 lg:pt-20">
      <p className="label">{q ? `Search results for “${q}”` : "The shop"}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <h1 className="display text-6xl leading-none sm:text-8xl">{q ? "Results" : title}</h1>
        <p className="label pb-2">{products.length} {products.length === 1 ? "object" : "objects"}</p>
      </div>

      <div className="mt-10 flex flex-col gap-5 border-y border-ink/15 py-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by category" className="-mx-1 flex flex-wrap gap-x-1 gap-y-1">
          {[{ name: "All", slug: "all" }, ...categories].map((c) => {
            const active = c.slug === category;
            return (
              <Link
                key={c.slug}
                href={href({ category: c.slug === "all" ? undefined : c.slug })}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 text-[12px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                  active ? "bg-ink text-paper" : "text-ink-soft hover:text-clay"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <form role="search" action="/products" className="flex items-center gap-2">
            {category !== "all" && <input type="hidden" name="category" value={category} />}
            <label htmlFor="shop-q" className="sr-only">
              Search the shop
            </label>
            <input id="shop-q" name="q" defaultValue={q} placeholder="Search…" className="field !w-40 !py-1.5 !text-sm" />
          </form>
          <p className="flex flex-wrap items-center gap-x-4 text-[12px] uppercase tracking-[0.12em]">
            {sorts.map((s) => (
              <Link
                key={s.value}
                href={href({ sort: s.value === "featured" ? undefined : s.value })}
                aria-current={s.value === sort ? "true" : undefined}
                className={s.value === sort ? "text-clay underline underline-offset-4" : "text-ink-mute hover:text-ink"}
              >
                {s.label}
              </Link>
            ))}
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-32">
          <p className="display text-4xl">Nothing matched.</p>
          <Link href="/products" className="btn-ghost mt-8">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-14 py-14 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          {products.map((p, i) => (
            <div key={p.id} className={i % 4 === 1 || i % 4 === 3 ? "xl:mt-14" : ""}>
              <ProductCard product={p} index={i} priority={i < 4} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
