# Ecommere

A full-stack MERN store: Next.js storefront, React admin panel, Express + MongoDB API.

## Run it

You need Node 20+, pnpm, and a MongoDB (local `mongodb://localhost:27017/ecommereproject` or Atlas).

```powershell
pnpm install

# API
copy apps\api\.env.example apps\api\.env      # then set MONGODB_URI
pnpm --filter api seed                        # categories, 12 products, admin user
pnpm --filter api dev                         # http://localhost:4000

# Storefront (new terminal)
copy apps\web\.env.example apps\web\.env
pnpm --filter web dev                         # http://localhost:3000

# Admin panel (new terminal)
copy apps\admin\.env.example apps\admin\.env
pnpm --filter admin dev                       # http://localhost:5173
```

Admin login after seeding: `admin@ecommere.test` / `Admin12345!`

## Development without Redis or Stripe

- No `REDIS_URL`: refresh tokens live in memory (restarting the API signs everyone out) and emails are logged to the console.
- No `STRIPE_SECRET_KEY`: checkout runs in test mode and orders are marked paid immediately.

For production set `NODE_ENV=production` and every secret in `apps/api/.env.example`. For real card payments set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` in the API and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `apps/web/.env`.

If the API is stopped, the storefront still renders from a built-in copy of the catalog (browsing only; ordering needs the API).

## Layout

- `apps/web` Next.js storefront (shop, product pages, bag, checkout, accounts, orders)
- `apps/admin` Vite admin (dashboard, products, orders)
- `apps/api` Express API (auth, products, categories, cart, orders, payments, reviews)
- `packages/validation` shared Zod schemas

Product images in `apps/web/public/products` are generated illustrations; replace them with real photography.
Architecture notes are in `ARCHITECTURE.md`.
