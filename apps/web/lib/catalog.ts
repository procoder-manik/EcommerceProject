import catalogJson from "./catalog.json";
import { API_URL } from "./api";

export interface Variant {
  sku: string;
  label: string;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  categorySlug: string;
  image: string;
  images: string[];
  description: string;
  details: string[];
  variantLabel: string;
  variants: Variant[];
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

type FallbackProduct = (typeof catalogJson)["products"][number];

const skuFor = (base: string, option: string) => `${base}-${option.replace(/[^a-z0-9]/gi, "").toUpperCase()}`;

function fromFallback(p: FallbackProduct): Product {
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    rating: p.rating,
    reviewCount: p.reviewCount,
    category: p.category,
    categorySlug: p.categorySlug,
    image: p.images[0],
    images: p.images,
    description: p.description,
    details: p.details,
    variantLabel: p.variantLabel,
    variants: p.variantOptions.map((o) => ({ sku: skuFor(p.sku, o), label: o, stock: 20 })),
    stock: p.stock,
  };
}

const fallbackCategories: Category[] = catalogJson.categories.map((c) => ({ id: c.slug, name: c.name, slug: c.slug }));
const fallbackProducts: Product[] = catalogJson.products.map(fromFallback);

function fromApi(p: any, cats: Category[]): Product {
  const cat = cats.find((c) => c.id === String(p.categoryId));
  const extra = catalogJson.products.find((f) => f.slug === p.slug);
  const first = p.variants?.[0]?.options ? Object.keys(p.variants[0].options)[0] : undefined;
  return {
    id: String(p._id ?? p.id),
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    rating: p.ratingAvg ?? 0,
    reviewCount: p.ratingCount ?? 0,
    category: cat?.name ?? "Shop",
    categorySlug: cat?.slug ?? "shop",
    image: p.images?.[0] ?? "/products/placeholder.svg",
    images: p.images?.length ? p.images : ["/products/placeholder.svg"],
    description: p.description,
    details: extra?.details ?? [],
    variantLabel: first ? first.charAt(0).toUpperCase() + first.slice(1) : "Option",
    variants: (p.variants ?? []).map((v: any) => ({
      sku: v.sku,
      label: first ? v.options?.[first] : v.sku,
      stock: v.stock ?? 0,
    })),
    stock: p.stock ?? 0,
  };
}

// Server-side fetch with a short timeout so a stopped API doesn't hang pages.
const SERVER_API = process.env.API_INTERNAL_URL ?? API_URL;

async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API}${path}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  const data = await serverGet<any[]>("/categories");
  if (!data || data.length === 0) return fallbackCategories;
  return data.map((c) => ({ id: String(c._id ?? c.id), name: c.name, slug: c.slug }));
}

export interface ProductQuery {
  category?: string;
  q?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "rating";
}

export async function getProducts(query: ProductQuery = {}): Promise<{ products: Product[]; live: boolean }> {
  const cats = await getCategories();
  const data = await serverGet<any[]>("/products?limit=100");
  const live = Boolean(data && data.length);
  let list = live ? data!.map((p) => fromApi(p, cats)) : fallbackProducts;

  if (query.category && query.category !== "all") list = list.filter((p) => p.categorySlug === query.category);
  if (query.q) {
    const q = query.q.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q));
  }
  const sorted = [...list];
  if (query.sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (query.sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else if (query.sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
  return { products: sorted, live };
}

export async function getProduct(slug: string): Promise<Product | null> {
  const cats = await getCategories();
  const data = await serverGet<any>(`/products/${slug}`);
  if (data && data.slug) return fromApi(data, cats);
  return fallbackProducts.find((p) => p.slug === slug) ?? null;
}
