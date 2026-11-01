export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

export interface CartItem {
  productId: string;
  variantSku?: string;
  qty: number;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
}
