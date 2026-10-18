#!/usr/bin/env node
/**
 * Seed products from a JSON file into local Supabase via stockos_create_product.
 *
 * Usage:
 *   node scripts/seed-products-json.mjs <status.json> <owner-access-token> <products.json> [--dry-run]
 *
 * Each item needs: sku, name, category, unit, sellingPrice, openingQuantity,
 * purchaseTotal; optional: minStock, description, supplier, shelfLocation, barcode.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const positional = args.filter((a) => !a.startsWith("--"));
const [statusFile, accessToken, productsFile] = positional;

assert.ok(statusFile && accessToken && productsFile, "Usage: node scripts/seed-products-json.mjs <status.json> <token> <products.json> [--dry-run]");
assert.ok(fs.existsSync(statusFile), `Status file not found: ${statusFile}`);
assert.ok(fs.existsSync(productsFile), `Products file not found: ${productsFile}`);

const status = JSON.parse(fs.readFileSync(statusFile, "utf8").replace(/^﻿/, ""));
assert.ok(typeof status.API_URL === "string" && URL.canParse(status.API_URL), "Refuse invalid API origin");
const api = new URL(status.API_URL);
assert.ok(api.protocol === "http:" && api.hostname === "127.0.0.1"
  && [api.origin, `${api.origin}/`].includes(status.API_URL), "Refuse non-local API origin");
const apiUrl = api.origin;
const anonKey = status.ANON_KEY;

const { CreateProductInputSchema } = await import("../src/features/products/schemas/product-rpc.schema.ts");
const products = JSON.parse(fs.readFileSync(productsFile, "utf8").replace(/^﻿/, ""));
assert.ok(Array.isArray(products) && products.length > 0, "Products JSON must be a non-empty array");

const payloads = products.map((p) => {
  const payload = {
    requestId: randomUUID(),
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    minStock: p.minStock ?? 0,
    sellingPrice: p.sellingPrice,
    supplier: p.supplier,
    shelfLocation: p.shelfLocation,
    barcode: p.barcode,
    description: p.description,
    openingQuantity: p.openingQuantity,
    purchaseTotal: p.purchaseTotal,
    ...(p.cartonCount ? { cartonCount: p.cartonCount } : {}),
    ...(p.unitsPerCarton ? { unitsPerCarton: p.unitsPerCarton } : {}),
  };
  const parsed = CreateProductInputSchema.safeParse(payload);
  assert.ok(parsed.success, `Validation failed for ${p.sku}: ${JSON.stringify(parsed.error?.issues)}`);
  return payload;
});

console.log(`Validated ${payloads.length}/${products.length} products against CreateProductInputSchema.`);
if (isDryRun) process.exit(0);

let seededCount = 0;
for (const payload of payloads) {
  const res = await fetch(`${apiUrl}/rest/v1/rpc/stockos_create_product`, {
    method: "POST",
    redirect: "error",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ p_input: payload }),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) {
    console.error(`Failed to seed ${payload.sku}:`, JSON.stringify(body));
    continue;
  }
  seededCount++;
  console.log(`Seeded [${seededCount}/${payloads.length}] ${payload.sku} - ${payload.name}`);
}

console.log(`\nSeeding completed: ${seededCount}/${payloads.length} products created.`);
if (seededCount !== payloads.length) process.exit(1);
