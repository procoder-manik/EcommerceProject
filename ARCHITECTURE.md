# E-Commerce Platform — System Architecture

Oct 31, 2026

## Overview & Assumptions

This document specifies a production-grade architecture for a full-featured e-commerce platform built on the MERN stack (MongoDB, Express, React, Node.js), matching the project folder found on your computer (`all mern project/EcommereProject`), which is currently empty — this is a greenfield design.

**Goals:** a storefront (browse, search, cart, checkout, order tracking) and an admin panel (catalog, orders, users, analytics), built to launch fast as an MVP and scale to real traffic without a rewrite.

**Assumptions** (stated so they're easy to challenge):

- Single-vendor store (one seller/catalog owner), not a multi-tenant marketplace. A marketplace model would change the data model and payouts significantly — flag early if that's actually the need.
- Card payments via Stripe (swappable for a regional processor).
- Launch region has no unusual data-residency requirement.
- Team size is small (1–4 developers) — the plan favors a modular monolith over microservices for v1, with clean seams to split out services later if scale demands it.

## Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React 18 + Vite, TypeScript | Fast dev server, type safety, no need for Next.js SSR unless SEO on product pages matters a lot (see note below) |
| State / data | Redux Toolkit or Zustand + React Query (TanStack Query) | React Query handles server cache/fetching; Redux/Zustand handles UI/cart state |
| Styling | Tailwind CSS | Fast to build consistent, responsive UI |
| Backend | Node.js 20 LTS + Express.js, TypeScript | Matches MERN, huge ecosystem, easy to hire for |
| Database | MongoDB (Atlas) + Mongoose | Flexible schema for catalog variants; Atlas gives managed backups/scaling |
| Cache / sessions / queues | Redis (Upstash or Elasticache) | Session store, cart cache, rate limiting, BullMQ job queues |
| Search | MongoDB Atlas Search (or Algolia/Meilisearch if budget allows) | Full-text + faceted product search without a separate cluster to start |
| Auth | JWT (access + refresh) + bcrypt, optional Google/Facebook OAuth | Stateless API auth, refresh tokens in httpOnly cookies |
| Payments | Stripe (Checkout + Payment Intents + Webhooks) | PCI compliance offloaded, strong docs, supports SCA |
| File storage | AWS S3 / Cloudinary | Product images, user uploads, with CDN delivery |
| Email | Resend or SendGrid | Order confirmations, password reset, shipping updates |
| CI/CD | GitHub Actions | Lint/test/build on PR, deploy on merge |
| Hosting | Vercel (frontend) + Render/Railway/AWS ECS (API) + MongoDB Atlas | Low-ops to start; AWS ECS/EKS path if you outgrow PaaS |
| Monitoring | Sentry (errors) + Logtail/CloudWatch (logs) + UptimeRobot | Catch regressions and downtime early |
| Containerization | Docker + docker-compose for local dev | Parity between dev/staging/prod |

**Note on Next.js:** if organic search traffic on product pages matters (most e-commerce does), swap plain React for Next.js (App Router) so product/category pages are server-rendered or statically generated. The API, database, and everything else below is unaffected either way — only the frontend rendering strategy changes. Default recommendation: **use Next.js** for the storefront, plain React (Vite) is fine for the admin panel.

## System Architecture

&#91;embedded content: system architecture · client, CDN, API, data stores, third-party services\]

Clients (storefront, admin panel) go through a CDN/load balancer to a single Express API that owns the business logic for auth, catalog, cart, orders and payments. The API reads/writes MongoDB as the system of record, uses Redis for sessions, cart cache, rate-limiting and background job queues (BullMQ), stores media in S3/Cloudinary, and calls out to Stripe for payments and an email provider for transactional notifications. This is a modular monolith: one deployable API with clearly separated internal modules, not a microservices mesh — simpler to run and debug for v1, and each module can be split into its own service later if a specific one (e.g. search, or order processing) needs to scale independently.

## Project Structure

A monorepo with two apps and a shared package keeps types and validation schemas in sync between frontend and backend.

```
EcommereProject/
├── apps/
│   ├── web/                  # Storefront (Next.js)
│   │   ├── app/               # routes: /, /products/[slug], /cart, /checkout, /account
│   │   ├── components/
│   │   ├── lib/                # API client, auth helpers
│   │   └── public/
│   ├── admin/                 # Admin panel (React + Vite)
│   │   ├── src/pages/          # products, orders, customers, dashboard
│   │   ├── src/components/
│   │   └── src/lib/
│   └── api/                   # Express API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/        # controller, service, routes, validators
│       │   │   ├── users/
│       │   │   ├── products/
│       │   │   ├── categories/
│       │   │   ├── cart/
│       │   │   ├── orders/
│       │   │   ├── payments/    # Stripe integration, webhook handler
│       │   │   └── reviews/
│       │   ├── middleware/      # auth, error-handler, rate-limit, validate
│       │   ├── jobs/            # BullMQ workers (emails, stock sync)
│       │   ├── config/          # env, db, redis, stripe clients
│       │   └── app.ts, server.ts
│       └── tests/
├── packages/
│   ├── shared-types/           # TypeScript interfaces shared by web/admin/api
│   └── validation/              # Zod schemas shared by frontend + backend
├── docker-compose.yml           # mongo, redis, api, web for local dev
├── .github/workflows/           # CI: lint, test, build, deploy
└── turbo.json / pnpm-workspace.yaml
```

Each module under `api/src/modules/*` follows the same shape: `*.routes.ts` → `*.controller.ts` → `*.service.ts` → `*.model.ts`, so business logic never sits directly in a route handler and is easy to unit test.

## Database Schema (MongoDB)

| Collection | Key fields | Notes |
| --- | --- | --- |
| `users` | `name`, `email` (unique), `passwordHash`, `role` (`customer`→`admin`), `addresses[]`, `provider` (local/google), `createdAt` | Passwords hashed with bcrypt; `role` drives route guards |
| `products` | `name`, `slug` (unique), `description`, `price`, `compareAtPrice`, `images[]`, `categoryId` (ref `categories`), `variants[]` (size/color → own SKU + stock), `stock`, `ratingAvg`, `ratingCount`, `isActive` | Variants embedded — no separate collection needed unless variant count explodes |
| `categories` | `name`, `slug`, `parentId` (self-ref, for nested categories) | Small, static-ish; cached in Redis |
| `carts` | `userId` (nullable for guest carts via `sessionId`), `items[]` (`productId`, `variantId`, `qty`, `priceAtAdd`) | TTL index so abandoned guest carts expire automatically |
| `orders` | `userId`, `items[]` (snapshot of product/price at purchase time), `shippingAddress`, `status` (`pending`→`paid`→`shipped`→`delivered`→`cancelled`), `paymentIntentId`, `totals` (`subtotal`,`tax`,`shipping`,`total`), `timeline[]` (status history) | Never reference live product price — always store a snapshot so historical orders stay accurate |
| `payments` | `orderId`, `provider` (`stripe`), `providerPaymentId`, `amount`, `status`, `rawWebhookPayload` | Kept separate from `orders` for auditability and webhook idempotency |
| `reviews` | `productId`, `userId`, `rating`, `comment`, `createdAt` | Unique index on `(productId, userId)` so one review per purchase |

**Indexes that matter from day one:** `products.slug` (unique), `products.categoryId`, text/Atlas-Search index on `products.name`+`description`, `users.email` (unique), `orders.userId`, `orders.status`, `carts.sessionId` with TTL.

**Why embed vs reference:** variants are embedded in `products` (always read together, rarely huge). Orders snapshot product data rather than referencing it (price history must be immutable). Reviews reference both `product` and `user` (read independently, can grow large, paginated).

## API Design

All routes under `/api/v1`, JSON in/out, versioned from day one so breaking changes don't strand old clients.

| Resource | Endpoints | Auth |
| --- | --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/google` (OAuth), `POST /auth/forgot-password`, `POST /auth/reset-password` | Public |
| Users | `GET /users/me`, `PATCH /users/me`, `GET /users` (admin list), `PATCH /users/:id/role` (admin) | Self / Admin |
| Products | `GET /products` (filters: category, price range, search, sort, page), `GET /products/:slug`, `POST /products` (admin), `PATCH /products/:id` (admin), `DELETE /products/:id` (admin) | Public read / Admin write |
| Categories | `GET /categories`, `POST /categories` (admin), `PATCH /categories/:id` (admin) | Public read / Admin write |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId` | Self (or guest session) |
| Orders | `POST /orders` (create from cart), `GET /orders` (own orders), `GET /orders/:id`, `GET /admin/orders` (all, admin), `PATCH /admin/orders/:id/status` (admin) | Self / Admin |
| Payments | `POST /payments/create-intent`, `POST /payments/webhook` (Stripe signature-verified, not user-auth) | Self / Stripe server |
| Reviews | `GET /products/:id/reviews`, `POST /products/:id/reviews` (verified purchase only) | Public read / Self write |

**Conventions:** pagination via `?page=&limit=` returning `{ data, meta: { page, totalPages, totalItems } }`; errors as `{ error: { code, message, details? } }` with consistent HTTP status codes; all list endpoints support filtering/sorting via query params validated with Zod before hitting a controller.

## Authentication & Authorization

- **Password auth:** bcrypt (cost factor 12) for stored hashes; never log or return password fields.
- **Tokens:** short-lived JWT access token (15 min) returned in the response body; long-lived refresh token (7–30 days) set as an `httpOnly`, `Secure`, `SameSite=Strict` cookie. `/auth/refresh` rotates the refresh token on every use and checks it against a Redis-stored allowlist (lets you revoke sessions — e.g. on password change — which a pure stateless JWT can't do).
- **OAuth:** Google/Facebook via Passport.js strategies, issuing the same JWT pair on success so the rest of the app doesn't care how the user signed in.
- **Authorization:** role claim (`customer` | `admin`, extendable to `vendor` later) embedded in the access token; an `authenticate` middleware verifies the JWT, a `requireRole('admin')` middleware guards admin routes. Resource-level checks (a user can only see *their own* orders) happen in the service layer, not just the route guard.
- **Password reset:** one-time, short-lived (15 min) signed token emailed to the user; never reveal whether an email exists in the "forgot password" response (prevents account enumeration).
- **Rate limiting:** `express-rate-limit` backed by Redis on `/auth/*` (prevents credential-stuffing/brute force) and more loosely on the rest of the API.

## Payments & Order Lifecycle

1. Customer checks out → API re-validates cart prices/stock server-side (never trust the client's totals) → creates an `order` with status `pending` and a Stripe `PaymentIntent` for the exact server-computed total.
2. Frontend confirms the payment with Stripe.js (card entry never touches your server — PCI scope stays minimal).
3. Stripe sends a `payment_intent.succeeded` (or `.payment_failed`) event to `POST /payments/webhook`.
4. The webhook handler verifies the Stripe signature, checks `providerPaymentId` hasn't been processed already (idempotency — Stripe retries webhooks), then flips the order to `paid`, decrements `products.stock`, and enqueues a confirmation-email job.
5. **Order status only ever changes via the webhook or an admin action — never from the client's "success" redirect**, which a user could hit directly without actually paying.
6. Fulfilment: admin marks `shipped` (triggers a shipping-notification email with tracking, if available) → `delivered`. Cancellations/refunds go through `POST /admin/orders/:id/refund`, which calls Stripe's refund API and restocks items.

This keeps money-moving logic entirely server-side and auditable, with `payments` as an append-only log separate from the mutable `orders` state.

## Caching, Search & Performance

- **Redis caching:** category tree and homepage featured-products cached with a short TTL (5–15 min) and invalidated on admin writes; session/cart lookups are Redis-first; hot product-detail pages cached per-slug.
- **Search:** MongoDB Atlas Search covers full-text + faceted filtering (category, price range, rating) without a separate cluster. If query volume or relevance tuning outgrows it, swap in Meilisearch or Algolia behind the same `products.search()` service method — nothing above that layer needs to change.
- **Images:** uploaded to S3/Cloudinary, served through the CDN with on-the-fly resizing (thumbnail/medium/full) and WebP/AVIF; never serve raw uploads to the client.
- **Pagination:** cursor-based (not offset) on large, frequently-changing lists like orders, so results stay stable as new rows are inserted.
- **N+1 avoidance:** Mongoose `.populate()` used sparingly; list endpoints project only the fields the UI needs rather than returning full documents.
- **Background jobs (BullMQ + Redis):** order-confirmation emails, stock-sync, image-processing, and any webhook side-effects run as jobs, not inline in the request — keeps API response times fast and retries failures automatically.

## Security Hardening

- [ ] Validate every request body/query/params with Zod schemas before it reaches a controller — reject unknown fields
- [ ] Use Mongoose/parameterized queries exclusively; never build queries from raw string concatenation (NoSQL injection)
- [ ] `helmet` for security headers; strict CORS allowlist (only the storefront/admin origins, not `*`)
- [ ] Rate-limit auth, checkout, and review-submission endpoints specifically, beyond the global limit
- [ ] All secrets (DB URI, JWT secret, Stripe keys, SMTP creds) in environment variables / a secrets manager — never committed, never in client bundles
- [ ] HTTPS everywhere (enforced at the load balancer/CDN); HSTS header enabled
- [ ] Sanitize any user-generated content (reviews, names) before rendering, to prevent stored XSS
- [ ] Stripe webhook signature verification on every event (reject unsigned/invalid requests)
- [ ] File uploads: validate MIME type + size server-side, strip EXIF, store outside the web root (S3), never trust the client-supplied filename
- [ ] Least-privilege DB user for the API (no `dropDatabase`/admin rights); Atlas network access restricted to known IPs/VPC
- [ ] Dependency scanning (`npm audit` / Dependabot) in CI; pin lockfiles
- [ ] Centralized error handler that never leaks stack traces or internal messages to clients in production

## DevOps & Deployment

| Environment | Purpose | Notes |
| --- | --- | --- |
| Local | Dev on laptop | `docker-compose up` brings up Mongo + Redis; API/web run with hot reload |
| Staging | Pre-prod QA | Mirrors production config, seeded with realistic test data, Stripe in test mode |
| Production | Live | Real Stripe keys, backups enabled, monitoring/alerts on |

**CI/CD (GitHub Actions), on every PR:** install → lint → type-check → unit tests → build. **On merge to `main`:** the same pipeline, then deploy — frontend to Vercel (preview URLs per PR for free), API to Render/Railway/AWS ECS via Docker image, with a manual-approval gate before production if the team wants one.

**Containers:** the API ships as a Docker image (`node:20-alpine` base, multi-stage build) so staging and production run the identical artifact. `docker-compose.yml` reproduces the full stack locally.

**Backups & recovery:** MongoDB Atlas automated daily backups with point-in-time recovery; S3 versioning enabled on the media bucket.

**Observability:** Sentry for exception tracking (frontend + backend), structured JSON logs shipped to CloudWatch/Logtail, uptime checks on `/health` and the storefront homepage, and a dashboard for key business metrics (orders/day, cart-abandonment rate, p95 API latency).

## Scalability Roadmap

&#91;embedded content: roadmap · MVP → Growth → Scale, with gates\]

**Phase 1 — MVP (weeks 1–8):** core catalog, cart, checkout, auth, a bare-bones admin panel. Deployed as the modular monolith described above on a single small instance per service. Goal: get a real store in front of real customers fast.

**Phase 2 — Growth (months 2–6, triggered by a successful soft launch):** tune Atlas Search relevance, add reviews/ratings, email marketing hooks, Redis caching where traffic shows it's needed, and real observability (Sentry, dashboards). Infrastructure scales vertically/horizontally as-is — no architecture change yet, just more instances and better caching.

**Phase 3 — Scale (triggered by sustained high traffic or a specific module becoming a bottleneck):** extract the modules under load — typically search or order-processing — into their own deployable services behind the same API gateway; consider multi-region deployment and read replicas for MongoDB; revisit whether a dedicated search engine (Meilisearch/Algolia/Elasticsearch) is now worth the operational cost. Re-evaluate multi-tenant/marketplace support here if the business model has shifted toward it.

The point of this sequencing: don't build Phase 3 infrastructure before Phase 1 has paying customers — the modular-monolith boundaries defined in the Project Structure section exist precisely so this split can happen later without a rewrite.
