import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";
import Pic from "@/components/Pic";
import ProductCard from "@/components/ProductCard";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { getCategories, getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const ticker = ["Free shipping over $50", "30-day returns", "Made to last", "Two-year warranty", "Secure checkout"];

const promises = [
  ["Fewer, better things", "Every object is tested by us before it earns a place here."],
  ["Honest pricing", "No inflated ‘was’ prices. When something is on sale, it is."],
  ["Repair over replace", "Our bags, watches and leather goods come with a repair service."],
];

export default async function HomePage() {
  const [{ products }, categories] = await Promise.all([getProducts({ sort: "featured" }), getCategories()]);
  const featured = products.slice(0, 6);
  const hero = products.find((p) => p.slug === "aria-wireless-headphones") ?? products[0];
  const hero2 = products.find((p) => p.slug === "lumen-table-lamp") ?? products[1];
  const countFor = (slug: string) => products.filter((p) => p.categorySlug === slug).length;

  return (
    <>
      {/* HERO — asymmetric collage */}
      <section className="wrap grid gap-10 pb-20 pt-10 lg:grid-cols-12 lg:pb-28 lg:pt-16">
        <div className="flex flex-col justify-between lg:col-span-7">
          <p className="label">Autumn edit — {products.length} objects</p>
          <h1
            className="display my-10 leading-[0.92]"
            style={{ fontSize: "clamp(3.4rem, 10.2vw, 10.5rem)" }}
          >
            <span className="mask"><span>Objects</span></span>
            <span className="mask"><span><em className="font-light italic text-clay">made</em> to</span></span>
            <span className="mask"><span>be kept.</span></span>
          </h1>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-sm text-[17px] leading-relaxed text-ink-soft">
              A small, carefully edited store of audio, bags, home goods and accessories — chosen for how they feel after five
              years, not five minutes.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/products" className="btn">
                Shop the edit <ArrowRight width={18} height={18} />
              </Link>
              <Link href="#index" className="link-u hidden text-[13px] uppercase tracking-[0.12em] sm:inline">
                See the index
              </Link>
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="reveal-img relative aspect-[4/5] overflow-hidden bg-paper-deep">
            <Pic src={hero.image} alt={hero.name} priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
          <Link
            href={`/products/${hero2.slug}`}
            className="reveal-img absolute -bottom-10 -right-3 hidden w-[32%] border-[6px] border-paper bg-paper-deep shadow-xl sm:block lg:-right-6"
            style={{ animationDelay: "0.35s" }}
            aria-label={`View ${hero2.name}`}
          >
            <div className="relative aspect-[4/5]">
              <Pic src={hero2.image} alt={hero2.name} sizes="20vw" className="object-cover" />
            </div>
          </Link>
        </div>
      </section>

      {/* TICKER */}
      <div className="overflow-hidden border-y border-ink/15 bg-paper-deep py-4" aria-hidden>
        <div className="ticker">
          {[...ticker, ...ticker, ...ticker, ...ticker].map((t, i) => (
            <span key={i} className="mx-8 flex items-center gap-8 font-mono text-[12px] uppercase tracking-[0.16em]">
              {t} <span className="text-clay">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* INDEX — staggered grid */}
      <section id="index" className="wrap pt-24 lg:pt-32">
        <div className="mb-14 flex items-end justify-between gap-8">
          <h2 className="display text-5xl leading-[0.95] sm:text-7xl">
            Selected
            <br />
            <em className="italic text-clay">this season</em>
          </h2>
          <Link href="/products" className="link-u hidden items-center gap-2 text-[13px] uppercase tracking-[0.12em] sm:inline-flex">
            All objects <ArrowRight width={16} height={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-14 lg:grid-cols-3 lg:gap-x-8">
          {featured.map((p, i) => (
            <div key={p.id} className={i % 3 === 1 ? "lg:mt-16" : i % 3 === 2 ? "lg:mt-32" : ""}>
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* MANIFESTO — chapter gate */}
      <section className="mt-32 bg-moss text-paper lg:mt-44">
        <div className="wrap grid gap-16 py-24 lg:grid-cols-12 lg:py-32">
          <h2 className="display text-4xl leading-[1.05] sm:text-6xl lg:col-span-7">
            We sell fewer things, and we <em className="italic text-moss-wash">stand behind</em> every one of them.
          </h2>
          <ol className="divide-y divide-paper/20 border-y border-paper/20 lg:col-span-5 lg:self-end">
            {promises.map(([t, b], i) => (
              <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6">
                <span className="font-mono text-xs text-paper/50">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="display text-2xl">{t}</p>
                  <p className="mt-1 text-sm text-paper/70">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CATEGORY LEDGER */}
      <section className="wrap pt-24 lg:pt-32">
        <p className="label mb-6">Browse by category</p>
        <ul className="border-t border-ink">
          {categories.map((c, i) => (
            <li key={c.slug} className="border-b border-ink/25">
              <Link
                href={`/products?category=${c.slug}`}
                className="group flex items-baseline gap-5 py-6 transition-colors duration-300 hover:text-clay sm:gap-10 sm:py-8"
              >
                <span className="font-mono text-xs text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
                <span className="display flex-1 text-5xl transition-transform duration-500 ease-out group-hover:translate-x-3 sm:text-7xl">
                  {c.name}
                </span>
                <span className="label">{countFor(c.slug)} items</span>
                <ArrowUpRight className="h-6 w-6 -translate-x-2 opacity-0 transition-all duration-500 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* NEWSLETTER */}
      <section className="wrap mt-32 lg:mt-44">
        <div className="grid items-end gap-10 bg-ink px-6 py-16 text-paper sm:px-14 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="label !text-paper/50">The letter</p>
            <h2 className="display mt-3 text-4xl leading-[1.05] sm:text-6xl">
              New arrivals, <em className="italic text-clay-wash">once a month.</em>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-paper/65">Take 10% off your first order. No noise, unsubscribe any time.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
