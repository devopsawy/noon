// In-memory product store. Good enough for the first version of the service;
// a database (for example RDS PostgreSQL from Caelo's Stage 2) replaces it later
// behind the same functions.

import { randomUUID } from "node:crypto";

const SAMPLE_PRODUCTS = [
  { name: "Wireless earbuds", description: "Bluetooth 5.3, 24-hour battery with case.", price: 199, currency: "SAR", category: "electronics", stock: 40 },
  { name: "Arabic coffee set", description: "Dallah and six finjan cups.", price: 149, currency: "SAR", category: "home", stock: 15 },
  { name: "Running shoes", description: "Lightweight trainers, breathable mesh.", price: 289, currency: "SAR", category: "sports", stock: 25 },
];

export const CATEGORIES = ["electronics", "home", "sports", "fashion", "beauty", "grocery"];

export function createStore(seed = SAMPLE_PRODUCTS) {
  const products = new Map();
  const add = (input) => {
    const product = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
    products.set(product.id, product);
    return product;
  };
  seed.forEach(add);

  return {
    list({ category, q } = {}) {
      const query = q?.toLowerCase();
      return [...products.values()].filter(
        (p) => (!category || p.category === category) && (!query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
      );
    },
    get: (id) => products.get(id) ?? null,
    add,
  };
}

/** Validate a new product; returns { value } or { errors }. */
export function validateProduct(body) {
  const errors = [];
  const b = body && typeof body === "object" ? body : {};
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name.length < 2 || name.length > 120) errors.push("name: 2 to 120 characters");
  const description = typeof b.description === "string" ? b.description.trim() : "";
  if (description.length > 2000) errors.push("description: at most 2000 characters");
  if (typeof b.price !== "number" || !Number.isFinite(b.price) || b.price <= 0) errors.push("price: a positive number");
  const currency = b.currency ?? "SAR";
  if (!/^[A-Z]{3}$/.test(currency)) errors.push("currency: a 3-letter ISO code such as SAR");
  if (!CATEGORIES.includes(b.category)) errors.push(`category: one of ${CATEGORIES.join(", ")}`);
  const stock = b.stock ?? 0;
  if (!Number.isInteger(stock) || stock < 0) errors.push("stock: a whole number, 0 or more");
  if (errors.length) return { errors };
  return { value: { name, description, price: Math.round(b.price * 100) / 100, currency, category: b.category, stock } };
}
