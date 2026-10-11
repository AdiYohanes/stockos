import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// 1. Check translations for warung wording compliance (avoid enterprise/factory remnants)
const idPath = path.join(root, "src/lib/i18n/translations/id.ts");
const enPath = path.join(root, "src/lib/i18n/translations/en.ts");

const idContent = fs.readFileSync(idPath, "utf8");
const enContent = fs.readFileSync(enPath, "utf8");

assert.ok(!idContent.includes("PT Logistik Nusantara"), "id.ts must not contain enterprise placeholder PT Logistik Nusantara");
assert.ok(!idContent.includes("rian.hidayat@logistik.com"), "id.ts must not contain enterprise email placeholder");
assert.ok(!idContent.includes("Jl. Industri Utama"), "id.ts must not contain industrial address placeholder");
assert.ok(!idContent.includes("MITRA PABRIK"), "id.ts must not use MITRA PABRIK badge");
assert.ok(!idContent.includes("pengiriman (KELUAR)"), "id.ts must use warung terminology for stock out instead of logistics pengiriman");
assert.ok(!idContent.includes("pengiriman masuk"), "id.ts must use warung terminology for stock in instead of pengiriman masuk");

assert.ok(!enContent.includes("Acme Logistics Corp"), "en.ts must not contain Acme Logistics Corp placeholder");
assert.ok(!enContent.includes("123 Industrial Way"), "en.ts must not contain 123 Industrial Way placeholder");
assert.ok(!enContent.includes("dispatch (OUT)"), "en.ts must use warung terminology for stock out instead of dispatch");

// 2. Check sample warung catalog module
const catalogModulePath = path.join(root, "src/features/products/sample-warung-catalog.ts");
assert.ok(fs.existsSync(catalogModulePath), "sample-warung-catalog.ts must exist");

// Import sample warung catalog
const {
  WARUNG_CATEGORIES,
  WARUNG_UNITS,
  SAMPLE_WARUNG_PRODUCTS,
  getSampleCatalogMetrics,
} = await import("../src/features/products/sample-warung-catalog.ts");
const { CreateProductInputSchema } = await import("../src/features/products/schemas/product-rpc.schema.ts");

assert.ok(Array.isArray(WARUNG_CATEGORIES), "WARUNG_CATEGORIES must be an array");
assert.ok(WARUNG_CATEGORIES.length >= 6, "Must provide at least 6 warung categories");
for (const expectedCat of ["Bahan Pokok", "Mi Instan", "Minuman", "Makanan Ringan"]) {
  assert.ok(WARUNG_CATEGORIES.includes(expectedCat), `WARUNG_CATEGORIES must include ${expectedCat}`);
}

assert.ok(Array.isArray(WARUNG_UNITS), "WARUNG_UNITS must be an array");
for (const expectedUnit of ["Pcs", "Bungkus", "Botol", "Sachet", "Renceng", "Kg"]) {
  assert.ok(WARUNG_UNITS.includes(expectedUnit), `WARUNG_UNITS must include ${expectedUnit}`);
}

assert.ok(Array.isArray(SAMPLE_WARUNG_PRODUCTS), "SAMPLE_WARUNG_PRODUCTS must be an array");
assert.ok(SAMPLE_WARUNG_PRODUCTS.length >= 18, "SAMPLE_WARUNG_PRODUCTS must have at least 18 items");

const skuSet = new Set();
let inStockCount = 0;
let lowStockCount = 0;
let outOfStockCount = 0;

for (const p of SAMPLE_WARUNG_PRODUCTS) {
  assert.ok(p.sku && p.sku.length >= 3, `SKU too short: ${p.sku}`);
  assert.ok(!skuSet.has(p.sku), `Duplicate SKU: ${p.sku}`);
  skuSet.add(p.sku);

  assert.ok(p.name && p.name.length >= 3, `Product name too short: ${p.name}`);
  assert.ok(WARUNG_CATEGORIES.includes(p.category), `Category not in WARUNG_CATEGORIES: ${p.category}`);
  assert.ok(WARUNG_UNITS.includes(p.unit), `Unit not in WARUNG_UNITS: ${p.unit}`);

  const sell = BigInt(p.sellingPrice);
  const purchase = BigInt(p.unitPurchasePrice);
  assert.ok(sell > 0n, `Selling price must be positive for ${p.sku}`);
  assert.ok(purchase >= 0n, `Purchase price cannot be negative for ${p.sku}`);
  assert.ok(sell >= purchase, `Selling price should cover purchase cost for ${p.sku}`);

  assert.ok(Number.isInteger(p.currentStock) && p.currentStock >= 0, `Invalid stock for ${p.sku}`);
  assert.ok(Number.isInteger(p.minStock) && p.minStock >= 0, `Invalid minStock for ${p.sku}`);

  if (p.currentStock === 0) outOfStockCount++;
  else if (p.currentStock <= p.minStock) lowStockCount++;
  else inStockCount++;

  // Validate that sample product conforms to CreateProductInputSchema
  const createInput = {
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
  const parseResult = CreateProductInputSchema.safeParse(createInput);
  assert.ok(
    parseResult.success,
    `Product ${p.sku} failed CreateProductInputSchema: ${JSON.stringify(parseResult.error?.issues)}`
  );
}

assert.ok(inStockCount > 0, "Must have in_stock items");
assert.ok(lowStockCount > 0, "Must have low_stock items");
assert.ok(outOfStockCount > 0, "Must have out_of_stock items");

const metrics = getSampleCatalogMetrics(SAMPLE_WARUNG_PRODUCTS);
assert.equal(metrics.totalProducts, SAMPLE_WARUNG_PRODUCTS.length);
assert.equal(metrics.inStockCount, inStockCount);
assert.equal(metrics.lowStockCount, lowStockCount);
assert.equal(metrics.outOfStockCount, outOfStockCount);
assert.ok(metrics.totalInventoryCost > 0, "Total inventory cost must be positive");
assert.ok(metrics.potentialSellingValue > metrics.totalInventoryCost, "Potential revenue must exceed cost");
assert.ok(metrics.potentialGrossProfit > 0, "Potential gross profit must be positive");

console.log("Warung catalog and wording checks PASS.");
console.log(`- Validated ${SAMPLE_WARUNG_PRODUCTS.length} warung products across ${WARUNG_CATEGORIES.length} categories.`);
console.log(`- Health distribution: ${inStockCount} in stock, ${lowStockCount} low stock, ${outOfStockCount} out of stock.`);
console.log(`- Valuation: Cost Rp ${metrics.totalInventoryCost.toLocaleString("id-ID")}, Potential Revenue Rp ${metrics.potentialSellingValue.toLocaleString("id-ID")}, Potential Profit Rp ${metrics.potentialGrossProfit.toLocaleString("id-ID")}.`);
