export const site = {
  name: "Ecommere",
  tagline: "Considered objects for everyday life",
  description:
    "A small, carefully edited store of well-made things: audio, bags, home goods and accessories chosen to last.",
  currency: "USD",
  freeShippingThreshold: 50,
  flatShipping: 6.99,
  taxRate: 0.08,
};

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: site.currency });
export const money = (n: number) => fmt.format(n);
