#!/usr/bin/env node
/**
 * Seed Warung Catalog Script
 *
 * Populates local Supabase instance with authentic Indonesian small shop (warung)
 * sample catalog data using the stockos_create_product RPC.
 *
 * Usage:
 *   node scripts/seed-warung-catalog.mjs [--dry-run]
 *   node scripts/seed-warung-catalog.mjs <status.json> <owner-access-token>
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";

const {
  WARUNG_CATEGORIES,
  SAMPLE_WARUNG_PRODUCTS,
  getSampleCatalogMetrics,
} = await import("../src/features/products/sample-warung-catalog.ts");
const { CreateProductInputSchema } = await import("../src/features/products/schemas/product-rpc.schema.ts");

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || args.length === 0;

console.log("=== StockOS Warung Sample Catalog Seed ===");
console.log(`Total sample products: ${SAMPLE_WARUNG_PRODUCTS.length}`);
console.log(`Categories (${WARUNG_CATEGORIES.length}): ${WARUNG_CATEGORIES.join(", ")}`);

const metrics = getSampleCatalogMetrics(SAMPLE_WARUNG_PRODUCTS);
console.log(`\nMetrics:`);
console.log(`- In stock: ${metrics.inStockCount}`);
console.log(`- Low stock: ${metrics.lowStockCount}`);
console.log(`- Out of stock: ${metrics.outOfStockCount}`);
console.log(`- Total inventory cost: Rp ${metrics.totalInventoryCost.toLocaleString("id-ID")}`);
console.log(`- Potential revenue: Rp ${metrics.potentialSellingValue.toLocaleString("id-ID")}`);
console.log(`- Potential gross profit: Rp ${metrics.potentialGrossProfit.toLocaleString("id-ID")}`);

// Validate all items against CreateProductInputSchema
let validatedCount = 0;
for (const p of SAMPLE_WARUNG_PRODUCTS) {
  const payload = {
    requestId: randomUUID(),
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    minStock: p.minStock,
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
  validatedCount++;
}

console.log(`\nSchema validation: ${validatedCount}/${SAMPLE_WARUNG_PRODUCTS.length} products passed CreateProductInputSchema.`);

if (isDryRun) {
  console.log("\nDry-run completed successfully. To seed into local Supabase, provide status.json and owner access token.");
  process.exit(0);
}

// Live seeding mode with local Supabase status file and access token
const statusFile = args[0];
const accessToken = args[1];

if (!statusFile || !fs.existsSync(statusFile) || !accessToken) {
  console.error("Error: status.json path and owner access token required for live seeding.");
  process.exit(1);
}

const status = JSON.parse(fs.readFileSync(statusFile, "utf8").replace(/^﻿/, ""));
assert.ok(typeof status.API_URL === "string" && URL.canParse(status.API_URL), "Refuse invalid API origin");
const api = new URL(status.API_URL);
assert.ok(api.protocol === "http:" && api.hostname === "127.0.0.1"
  && [api.origin, `${api.origin}/`].includes(status.API_URL), "Refuse non-local API origin");
const apiUrl = api.origin;
const anonKey = status.ANON_KEY;

console.log(`Connecting to local Supabase at ${apiUrl}...`);

let seededCount = 0;
for (const p of SAMPLE_WARUNG_PRODUCTS) {
  const payload = {
    requestId: randomUUID(),
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    minStock: p.minStock,
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
    console.error(`Failed to seed ${p.sku}:`, body);
  } else {
    seededCount++;
    console.log(`Seeded [${seededCount}/${SAMPLE_WARUNG_PRODUCTS.length}] ${p.sku} - ${p.name}`);
  }
}

console.log(`\nSeeding completed: ${seededCount}/${SAMPLE_WARUNG_PRODUCTS.length} products created.`);
if (seededCount !== SAMPLE_WARUNG_PRODUCTS.length) process.exitCode = 1;
