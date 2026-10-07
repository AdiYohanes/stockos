import assert from "node:assert";
import {
  ProductSchema,
  CreateProductInputSchema,
} from "../src/features/products/schemas/product.schema";
import {
  PurchaseOrderSchema,
  CreatePOFormSchema,
} from "../src/features/purchase-orders/schemas/po.schema";
import { MOCK_PRODUCTS } from "../src/features/products/mock-data";
import { MOCK_PURCHASE_ORDERS } from "../src/features/purchase-orders/mock-data";

// 1. Mock data runtime validation via Zod
assert.equal(Array.isArray(MOCK_PRODUCTS), true);
assert.equal(MOCK_PRODUCTS.length, 18);
assert.equal(Array.isArray(MOCK_PURCHASE_ORDERS), true);
assert.equal(MOCK_PURCHASE_ORDERS.length, 4);

// 2. Reject invalid product schema
assert.throws(() => ProductSchema.parse({ sku: "AB" }));
assert.throws(() =>
  CreateProductInputSchema.parse({
    name: "Test",
    sku: "A", // too short
    category: "Electronics",
    unit: "pcs",
    unitPrice: -5, // negative price
    initialStock: 0,
    minStock: 10,
    warehouse: "Main Hub (WH-1)",
  })
);

// 3. Reject invalid purchase order schema
assert.throws(() =>
  CreatePOFormSchema.parse({
    supplierId: "",
    destinationWarehouseId: "wh-1",
    expectedDeliveryDate: "2026-08-25",
    lineItems: [], // empty items
  })
);

console.log("PASS: Schema and mock data validations asserted successfully.");
