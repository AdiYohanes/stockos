import assert from "node:assert/strict";
import {
  ProductSchema,
  CreateProductInputSchema,
} from "../src/features/products/schemas/product.schema";
import { MOCK_PRODUCTS } from "../src/features/products/mock-data";
import { createInventoryStore } from "../src/features/inventory/store";

assert.equal(MOCK_PRODUCTS.length, 18);
assert.ok(MOCK_PRODUCTS.every((product) => !("warehouse" in product)));
assert.throws(() => ProductSchema.parse({ sku: "AB" }));

const input = {
  name: "Test Product",
  sku: "TEST-001",
  category: "Electronics",
  unit: "pcs",
  unitPrice: 10,
  initialStock: 0,
  minStock: 10,
  supplier: "Supplier A",
};
assert.ok(CreateProductInputSchema.safeParse(input).success);
assert.equal(CreateProductInputSchema.safeParse({ ...input, unitPrice: -5 }).success, false);
assert.equal(CreateProductInputSchema.safeParse({ ...input, sku: "A" }).success, false);

const inventory = createInventoryStore();
const item = inventory.getState().items[0];
assert.ok(!("warehouse" in item));
inventory.getState().recordMovement(item.id, "in", 2, "IN-TEST");
assert.equal(inventory.getState().items[0].currentStock, item.currentStock + 2);
assert.throws(() => inventory.getState().recordMovement(item.id, "out", Number.MAX_SAFE_INTEGER, "OUT-TEST"));
assert.equal(inventory.getState().items[0].currentStock, item.currentStock + 2);

import {
  ValuationReportInputSchema,
  MovementReportInputSchema,
  LowStockReportInputSchema,
  ExportReportInputSchema,
} from "../src/features/reports/schemas/reports-rpc.schema";

// Reports RPC schema validations
assert.ok(ValuationReportInputSchema.safeParse({}).success);
assert.ok(ValuationReportInputSchema.safeParse({ search: "kopi", category: "Minuman" }).success);
assert.equal(ValuationReportInputSchema.safeParse({ unknownKey: true }).success, false);

assert.ok(MovementReportInputSchema.safeParse({ startDate: "2026-09-01", endDate: "2026-10-01" }).success);
assert.equal(MovementReportInputSchema.safeParse({ startDate: "bad-date", endDate: "2026-10-01" }).success, false);
assert.equal(MovementReportInputSchema.safeParse({}).success, false);

assert.ok(LowStockReportInputSchema.safeParse({}).success);
assert.ok(LowStockReportInputSchema.safeParse({ search: "beras" }).success);

assert.ok(ExportReportInputSchema.safeParse({ kind: "valuation" }).success);
assert.ok(ExportReportInputSchema.safeParse({ kind: "movements", startDate: "2026-09-01", endDate: "2026-10-01" }).success);
assert.equal(ExportReportInputSchema.safeParse({ kind: "unsupported" }).success, false);

console.log("PASS: Products and stock movements work without warehouses or purchase orders.");
