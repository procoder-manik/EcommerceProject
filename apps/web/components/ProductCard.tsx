import Link from "next/link";
import { money } from "@/lib/site";
import type { Product } from "@/lib/catalog";
import Pic from "./Pic";

export default function ProductCard({ product, index, priority }: { product: Product; index?: number; priority?: boolean }) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const second = product.images[1];
  return (
    <Link href={`/products/${product.slug}`} className="group block cursor-pointer">
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
        <Pic
          src={product.image}
          alt={product.name}
          priority={priority}
          className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
        />
        {second && (
          <Pic
            src={second}
            alt=""
            className="object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
          />
        )}
        {onSale && (
          <span className="absolute left-3 top-3 bg-clay px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-paper">
            Sale
          </span>
        )}
        {index !== undefined && (
          <span className="absolute bottom-3 right-3 font-mono text-[11px] tracking-[0.14em] text-ink/60">
            N° {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="label">{product.category}</p>
          <h3 className="display mt-1 text-[1.35rem] leading-tight">
            <span className="link-u">{product.name}</span>
          </h3>
        </div>
        <p className="shrink-0 pt-1 text-sm tabular-nums">
          {onSale && <span className="mr-2 text-ink-mute line-through">{money(product.compareAtPrice!)}</span>}
          {money(product.price)}
        </p>
      </div>
    </Link>
  );
}
