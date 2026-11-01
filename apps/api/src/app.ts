import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { webhook } from "./modules/payments/payment.controller.js";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import orderRoutes, { adminOrderRouter } from "./modules/orders/order.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import reviewRoutes from "./modules/reviews/review.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(cookieParser());

// Stripe needs the exact raw request bytes to verify its signature, so
// this is wired up BEFORE express.json() parses (and re-serializes) the body.
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), webhook);

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin/orders", adminOrderRouter);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1", reviewRoutes); // nested under /products/:id/reviews

app.use(errorHandler);
