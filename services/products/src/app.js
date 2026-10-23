import express from "express";
import { CATEGORIES, createStore, validateProduct } from "./store.js";

export const SERVICE_NAME = "products";

export function createApp({ store = createStore() } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
  app.get("/readyz", (_req, res) => res.json({ status: "ready" }));

  app.get("/categories", (_req, res) => res.json({ items: CATEGORIES }));

  app.get("/products", (req, res) => {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const q = typeof req.query.q === "string" ? req.query.q.slice(0, 100) : undefined;
    const items = store.list({ category, q });
    res.json({ items, total: items.length });
  });

  app.get("/products/:id", (req, res) => {
    const product = store.get(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  });

  app.post("/products", (req, res) => {
    const { value, errors } = validateProduct(req.body);
    if (errors) return res.status(400).json({ error: "Invalid product", details: errors });
    res.status(201).json(store.add(value));
  });

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  // Malformed JSON and other errors: never leak stack traces.
  app.use((err, _req, res, _next) => {
    const status = err.type === "entity.parse.failed" ? 400 : err.status ?? 500;
    res.status(status).json({ error: status === 400 ? "Invalid JSON body" : "Internal error" });
  });

  return app;
}
