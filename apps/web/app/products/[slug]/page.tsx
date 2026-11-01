import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import Pic from "@/components/Pic";
import ProductCard from "@/components/ProductCard";
import Reviews from "@/components/Reviews";
import Stars from "@/components/Stars";
import { getProduct, getProducts } from "@/lib/catalog";
import { money, site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  return p ? { title: p.name, description: p.description } : { title: "Not found" };
}

const accordion = (summary: string, body: React.ReactNode) => (
  <details className="group border-b border-ink/15 py-4" key={summary}>
    <summary className="flex cursor-pointer items-center justify-between text-[13px] uppercase tracking-[0.12em]">
      {summary}
      <span className="text-lg leading-none transition-transform duration-300 group-open:rotate-45">+</span>
    </summary>
    <div className="mt-3 text-sm leading-relaxed text-ink-soft">{body}</div>
  </details>
);

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const { products } = await getProducts({ category: product.categorySlug });
  const related = products.filter((p) => p.id !== product.id).slice(0, 4);
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="wrap pt-8 lg:pt-12">
      <nav aria-label="Breadcrumb" className="label mb-8 flex gap-2">
        <Link href="/products" className="link-u">Shop</Link>/
        <Link href={`/products?category=${product.categorySlug}`} className="link-u">{product.category}</Link>/
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Gallery — snap-scroll on mobile, editorial stack on desktop */}
        <div className="lg:col-span-7">
          <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 lg:hidden">
            {product.images.map((src, i) => (
              <div key={src} className="relative aspect-[4/5] w-[86%] flex-none snap-center bg-paper-deep">
                <Pic src={src} alt={`${product.name} — view ${i + 1}`} sizes="86vw" priority={i === 0} className="object-cover" />
              </div>
            ))}
          </div>
          <div className="hidden gap-4 lg:grid lg:grid-cols-2">
            {product.images.map((src, i) => (
              <div key={src} className={`relative aspect-[4/5] bg-paper-deep ${i === 0 ? "col-span-2 aspect-[5/4]" : ""}`}>
                <Pic src={src} alt={`${product.name} — view ${i + 1}`} sizes="45vw" priority={i === 0} className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Info — sticky */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <p className="label">{product.category}</p>
            <h1 className="display mt-2 text-5xl leading-[1.02] sm:text-6xl">{product.name}</h1>
            <div className="mt-5 flex items-center gap-3">
              <Stars value={product.rating} />
              <span className="label">
                {product.rating.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </div>
            <p className="mt-6 text-2xl tabular-nums">
              {onSale && <span className="mr-3 text-lg text-ink-mute line-through">{money(product.compareAtPrice!)}</span>}
              {money(product.price)}
            </p>
            <p className="mt-6 max-w-md leading-relaxed text-ink-soft">{product.description}</p>

            <div className="mt-8">
              <AddToCart product={product} />
            </div>

            <div className="mt-10 border-t border-ink/15">
              {product.details.length > 0 &&
                accordion(
                  "Details",
                  <ul className="list-disc space-y-1 pl-5">
                    {product.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              {accordion(
                "Shipping & returns",
                `Free standard shipping on orders over $${site.freeShippingThreshold}, otherwise a flat ${money(site.flatShipping)}. Return anything within 30 days, unused and in its original packaging.`
              )}
              {accordion("Warranty", "Every product carries a two-year warranty against defects in materials and workmanship.")}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-28">
        <Reviews productId={product.id} />
      </div>

      {related.length > 0 && (
        <section className="mt-28" aria-labelledby="rel-h">
          <h2 id="rel-h" className="display mb-10 text-4xl sm:text-5xl">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
