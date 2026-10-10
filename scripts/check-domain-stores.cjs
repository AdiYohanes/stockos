/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

// ponytail: compile TS in this check process only; use project's runner when one exists.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { createProductsStore } = require("../src/features/products/store.ts");
const { MOCK_PRODUCTS } = require("../src/features/products/mock-data.ts");

function unchangedOnError(store, action) {
  const previous = store.getState();
  assert.throws(action);
  assert.equal(store.getState(), previous, "Rejected action must not publish any state");
}

const seed = structuredClone(MOCK_PRODUCTS);
const products = createProductsStore();
const isolatedProducts = createProductsStore();
assert.notEqual(products.getState().products, isolatedProducts.getState().products);
assert.notEqual(products.getState().products[0], isolatedProducts.getState().products[0]);
const input = { name: "Store check", sku: "CHECK-01", category: "Tools", unit: "pcs", minStock: 3, initialStock: 5, unitPrice: 2, supplier: "Supplier A" };
const added = products.getState().addProduct(input);
const second = products.getState().addProduct({ ...input, sku: "CHECK-02" });
assert.notEqual(added.id, second.id);
assert.equal(added.status, "in_stock");
const beforeUpdate = products.getState().products;
products.getState().updateProduct(added.id, { name: "Updated", minStock: 10 });
assert.equal(products.getState().products.find((p) => p.id === added.id).status, "low_stock");
assert.equal(beforeUpdate.find((p) => p.id === added.id).name, "Store check");
let subscriberA = 0;
let subscriberB = 0;
const stopA = products.subscribe(() => subscriberA++);
const stopB = products.subscribe(() => subscriberB++);
products.getState().recordMovement(added.id, "in", 5, "CHECK-IN");
products.getState().recordMovement(added.id, "out", 10, "CHECK-OUT");
assert.equal(subscriberA, 2);
assert.equal(subscriberB, 2);
stopA(); stopB();
const moved = products.getState().products.find((p) => p.id === added.id);
assert.equal(moved.currentStock, 0);
assert.equal(moved.status, "out_of_stock");
assert.equal(moved.movementLogs.length, 3);
assert.equal(new Set(moved.movementLogs.map((log) => log.id)).size, 3);
for (const quantity of [0, -1, 1.5, NaN, Infinity, 1]) {
  unchangedOnError(products, () => products.getState().recordMovement(added.id, "out", quantity, "INVALID"));
}
unchangedOnError(products, () => products.getState().recordMovement("missing", "in", 1, "INVALID"));
unchangedOnError(products, () => products.getState().updateProduct(added.id, { currentStock: -1 }));
unchangedOnError(products, () => products.getState().addProduct({ ...input, minStock: -1 }));
unchangedOnError(products, () => products.getState().addProduct({ ...input, name: "   " }));
unchangedOnError(products, () => products.getState().updateProduct(added.id, { sku: "   " }));
products.getState().deleteProduct(added.id);
assert.equal(products.getState().products.some((p) => p.id === added.id), false);
assert.deepEqual(isolatedProducts.getState().products, seed);
assert.deepEqual(MOCK_PRODUCTS, seed);

console.log("Products store checks passed.");

const { createInventoryStore } = require("../src/features/inventory/store.ts");
const { MOCK_INVENTORY_ITEMS, MOCK_STOCK_MOVEMENTS } = require("../src/features/inventory/mock-data.ts");
const inventorySeed = structuredClone(MOCK_INVENTORY_ITEMS);
const movementSeed = structuredClone(MOCK_STOCK_MOVEMENTS);
const inventory = createInventoryStore();
const isolatedInventory = createInventoryStore();
const item = inventory.getState().items.find((item) => item.availableStock > 1);
assert.ok(item);
let inventoryNotifications = 0;
const stopInventory = inventory.subscribe(() => inventoryNotifications++);
inventory.getState().recordMovement(item.id, "in", 5, "CHECK-IN");
inventory.getState().recordMovement(item.id, "out", 2, "CHECK-OUT");
assert.equal(inventoryNotifications, 2, "Stock and audit must publish atomically");
const balance = inventory.getState().items.find((current) => current.id === item.id);
assert.equal(balance.currentStock, item.currentStock + 3);
assert.equal(balance.availableStock, Math.max(0, balance.currentStock - balance.reservedStock));
assert.equal(inventory.getState().movements[0].previousStock, item.currentStock + 5);
assert.equal(inventory.getState().movements[0].newStock, balance.currentStock);
assert.equal(inventory.getState().movements.length, movementSeed.length + 2);
for (const quantity of [0, -1, 0.5, NaN, Infinity, balance.availableStock + 1]) {
  unchangedOnError(inventory, () => inventory.getState().recordMovement(item.id, "out", quantity, "INVALID"));
}
unchangedOnError(inventory, () => inventory.getState().recordMovement("missing", "in", 1, "INVALID"));
for (const quantity of [-1, NaN, Infinity, 0.5]) {
  unchangedOnError(inventory, () => inventory.getState().adjustStock(item.id, quantity, "cycle_count", "INVALID"));
}
const adjustmentReason = inventory.getState().movements.find((movement) => movement.reason)?.reason;
assert.ok(adjustmentReason, "Seed must supply a valid adjustment reason");
inventory.getState().adjustStock(item.id, 0, adjustmentReason, "CHECK-ADJUST");
assert.equal(inventory.getState().items.find((current) => current.id === item.id).status, "out_of_stock");
assert.equal(inventory.getState().movements[0].quantity, -balance.currentStock);
assert.equal(inventoryNotifications, 3);
stopInventory();
assert.deepEqual(isolatedInventory.getState().items, inventorySeed);
assert.deepEqual(MOCK_INVENTORY_ITEMS, inventorySeed);
assert.deepEqual(MOCK_STOCK_MOVEMENTS, movementSeed);
console.log("Inventory store checks passed.");

assert.ok(MOCK_PRODUCTS.every((product) => !("warehouse" in product)));
assert.ok(MOCK_INVENTORY_ITEMS.every((item) => !("warehouse" in item)));
require("./test-schemas.ts");
