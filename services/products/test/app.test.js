import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";

let server;
let base;

before(async () => {
  server = createApp({ store: createStore() }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const json = (path, init) => fetch(`${base}${path}`, init).then(async (r) => ({ status: r.status, body: await r.json() }));

describe("health", () => {
  it("reports liveness and readiness", async () => {
    assert.deepEqual((await json("/healthz")).body, { status: "ok" });
    assert.deepEqual((await json("/readyz")).body, { status: "ready" });
  });
});

describe("products", () => {
  it("lists the sample products", async () => {
    const { status, body } = await json("/products");
    assert.equal(status, 200);
    assert.equal(body.total, 3);
  });

  it("filters by category and searches by text", async () => {
    assert.equal((await json("/products?category=sports")).body.total, 1);
    assert.equal((await json("/products?q=coffee")).body.items[0].name, "Arabic coffee set");
  });

  it("adds a product and returns it by id", async () => {
    const created = await json("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Abaya", price: 349.5, category: "fashion", stock: 10 }),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.currency, "SAR");
    const fetched = await json(`/products/${created.body.id}`);
    assert.equal(fetched.body.name, "Abaya");
  });

  it("rejects invalid products with the reasons", async () => {
    const { status, body } = await json("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", price: -1, category: "toys" }),
    });
    assert.equal(status, 400);
    assert.equal(body.details.length, 3);
  });

  it("answers 404 for unknown products and 400 for malformed JSON", async () => {
    assert.equal((await json("/products/nope")).status, 404);
    const bad = await json("/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error, "Invalid JSON body");
  });
});
