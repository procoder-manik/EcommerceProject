import { Cart } from "./cart.model.js";
import { Product } from "../products/product.model.js";

export interface CartOwner {
  userId?: string;
  sessionId?: string;
}

function httpError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), { status, code });
}

function ownerQuery({ userId, sessionId }: CartOwner) {
  return userId ? { userId } : { sessionId };
}

export async function getOrCreateCart(owner: CartOwner) {
  let cart = await Cart.findOne(ownerQuery(owner));
  if (!cart) {
    cart = await Cart.create({
      ...owner,
      items: [],
      // Guest carts expire on their own (see cart.model.ts TTL index); a
      // signed-in user's cart is kept until they empty it themselves.
      expiresAt: owner.userId ? undefined : new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    });
  }
  return cart;
}

export async function addItemToCart(owner: CartOwner, productId: string, qty: number, variantSku?: string) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw httpError(404, "NOT_FOUND", "Product not found");

  const variant = variantSku ? product.variants.find((v) => v.sku === variantSku) : undefined;
  if (variantSku && !variant) throw httpError(400, "INVALID_VARIANT", "That variant doesn't exist for this product");

  const price = variant?.priceOverride ?? product.price;

  const cart = await getOrCreateCart(owner);
  const existing = cart.items.find(
    (i) => i.productId.toString() === productId && (i.variantSku ?? null) === (variantSku ?? null)
  );
  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({ productId, variantSku, qty, priceAtAdd: price } as never);
  }
  await cart.save();
  return cart;
}

export async function updateCartItem(owner: CartOwner, itemId: string, qty: number) {
  const cart = await getOrCreateCart(owner);
  const item = (cart.items as any).id(itemId);
  if (!item) throw httpError(404, "NOT_FOUND", "Cart item not found");
  item.qty = qty;
  await cart.save();
  return cart;
}

export async function removeCartItem(owner: CartOwner, itemId: string) {
  const cart = await getOrCreateCart(owner);
  (cart.items as any).pull({ _id: itemId });
  await cart.save();
  return cart;
}

// Rebuilds the cart from scratch from {productId, variantSku, qty} lines,
// skipping anything that no longer exists. Price snapshot is taken from the
// live product here, same as addItemToCart.
export async function replaceCartItems(
  owner: CartOwner,
  lines: { productId: string; variantSku?: string; qty: number }[]
) {
  const cart = await getOrCreateCart(owner);
  const next: { productId: string; variantSku?: string; qty: number; priceAtAdd: number }[] = [];

  for (const line of lines) {
    const product = await Product.findById(line.productId).catch(() => null);
    if (!product || !product.isActive) continue;
    const variant = line.variantSku ? product.variants.find((v) => v.sku === line.variantSku) : undefined;
    if (line.variantSku && !variant) continue;
    const existing = next.find((n) => String(n.productId) === String(product.id) && n.variantSku === line.variantSku);
    if (existing) existing.qty += line.qty;
    else next.push({ productId: product.id, variantSku: line.variantSku, qty: line.qty, priceAtAdd: variant?.priceOverride ?? product.price });
  }

  cart.items = next as never;
  await cart.save();
  return cart;
}
