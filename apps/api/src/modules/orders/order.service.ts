import { Cart } from "../cart/cart.model.js";
import { Product } from "../products/product.model.js";
import { stripe } from "../../config/stripe.js";
import { handlePaymentSucceeded } from "../payments/payment.service.js";
import { Order, type OrderStatus } from "./order.model.js";

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 50;
const FLAT_SHIPPING = 6.99;

function httpError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), { status, code });
}

// Re-prices the cart from the live product catalog and creates an order +
// a Stripe PaymentIntent for the exact server-computed total. The client's
// cart totals are never trusted for the charge — see ARCHITECTURE.md
// "Payments & Order Lifecycle".
export async function createOrderFromCart(userId: string, shippingAddress: Record<string, string>) {
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    throw httpError(400, "EMPTY_CART", "Your cart is empty");
  }

  const items: { productId: string; name: string; price: number; qty: number }[] = [];
  let subtotal = 0;

  for (const line of cart.items) {
    const product = await Product.findById(line.productId);
    if (!product || !product.isActive) continue;

    const variant = line.variantSku ? product.variants.find((v) => v.sku === line.variantSku) : undefined;
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock < line.qty) {
      throw httpError(409, "OUT_OF_STOCK", `${product.name} doesn't have enough stock`);
    }

    const price = variant?.priceOverride ?? product.price;
    items.push({ productId: String(product.id), name: product.name, price, qty: line.qty });
    subtotal += price * line.qty;
  }

  if (items.length === 0) throw httpError(400, "EMPTY_CART", "No purchasable items in cart");

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));

  const order = await Order.create({
    userId,
    items,
    shippingAddress,
    status: "pending",
    totals: { subtotal, tax, shipping, total },
    timeline: [{ status: "pending", at: new Date() }],
  });

  let clientSecret: string | null = null;

  if (stripe) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "usd",
      metadata: { orderId: String(order.id) },
    });
    order.paymentIntentId = paymentIntent.id;
    await order.save();
    clientSecret = paymentIntent.client_secret;
  } else {
    // Test mode (no STRIPE_SECRET_KEY, development only): skip the card step
    // and settle the order through the same code path the webhook uses.
    order.paymentIntentId = `test_${order.id}`;
    await order.save();
    await handlePaymentSucceeded({
      id: order.paymentIntentId,
      amount: Math.round(total * 100),
      metadata: { orderId: String(order.id) },
    });
  }

  // The cart has been converted to an order — empty it.
  cart.items = [] as never;
  await cart.save();

  const fresh = await Order.findById(order.id);
  return { order: fresh ?? order, clientSecret, testMode: !stripe };
}

export function listOrdersForUser(userId: string, page = 1, limit = 20) {
  return Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments({ userId }),
  ]);
}

export function getOrderForUser(userId: string, orderId: string) {
  return Order.findOne({ _id: orderId, userId });
}

export function listAllOrders(page = 1, limit = 20, status?: OrderStatus) {
  const query = status ? { status } : {};
  return Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(query),
  ]);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const order = await Order.findById(orderId);
  if (!order) throw httpError(404, "NOT_FOUND", "Order not found");
  order.status = status;
  order.timeline.push({ status, at: new Date() });
  await order.save();
  return order;
}
