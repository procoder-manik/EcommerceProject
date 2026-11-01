import { readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { Category } from "../modules/categories/category.model.js";
import { Product } from "../modules/products/product.model.js";
import { User } from "../modules/users/user.model.js";

interface CatalogProduct {
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  categorySlug: string;
  images: string[];
  description: string;
  variantLabel: string;
  variantOptions: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@ecommere.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";

async function main() {
  await connectDb();

  const catalog = JSON.parse(readFileSync(join(process.cwd(), "src/scripts/catalog.json"), "utf8")) as {
    categories: { name: string; slug: string }[];
    products: CatalogProduct[];
  };

  const categoryIds = new Map<string, unknown>();
  for (const c of catalog.categories) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    categoryIds.set(c.slug, doc.id);
  }

  for (const p of catalog.products) {
    const perVariant = Math.max(1, Math.floor(p.stock / p.variantOptions.length));
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? undefined,
        images: p.images,
        categoryId: categoryIds.get(p.categorySlug),
        stock: perVariant * p.variantOptions.length,
        ratingAvg: p.rating,
        ratingCount: p.reviewCount,
        isActive: true,
        variants: p.variantOptions.map((opt) => ({
          sku: `${p.sku}-${opt.replace(/[^a-z0-9]/gi, "").toUpperCase()}`,
          options: { [p.variantLabel.toLowerCase()]: opt },
          stock: perVariant,
        })),
      },
      { upsert: true, new: true }
    );
  }

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (!existing) {
    await User.create({
      name: "Store Admin",
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${catalog.categories.length} categories and ${catalog.products.length} products.`);
  // eslint-disable-next-line no-console
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}${existing ? " (already existed)" : ""}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed", err);
  process.exit(1);
});
