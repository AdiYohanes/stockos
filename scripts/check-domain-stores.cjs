/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

// ponytail: compile TS in this check process only; use project's runner when one exists.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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
const input = { name: "Store check", sku: "CHECK-01", category: "Tools", unit: "pcs", minStock: 3, initialStock: 5, unitPrice: 2 };
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

const { createPurchaseOrdersStore } = require("../src/features/purchase-orders/store.ts");
const { MOCK_PURCHASE_ORDERS } = require("../src/features/purchase-orders/mock-data.ts");
const poSeed = structuredClone(MOCK_PURCHASE_ORDERS);
const orders = createPurchaseOrdersStore();
const isolatedOrders = createPurchaseOrdersStore();
const issued = structuredClone(poSeed.find((order) => order.status === "ISSUED"));
assert.ok(issued);
issued.id = "po-check";
issued.poNumber = "PO-CHECK";
orders.getState().createPurchaseOrder(issued);
unchangedOnError(orders, () => orders.getState().createPurchaseOrder(issued));
unchangedOnError(orders, () => orders.getState().createPurchaseOrder({ ...issued, id: "invalid-po", poNumber: "INVALID-PO", lineItems: [issued.lineItems[0], issued.lineItems[0]] }));
unchangedOnError(orders, () => orders.getState().createPurchaseOrder({ ...issued, id: "invalid-po", poNumber: "INVALID-PO", lineItems: [{ ...issued.lineItems[0], receivedQuantity: issued.lineItems[0].orderedQuantity + 1 }] }));
issued.notes = "Outside mutation";
assert.notEqual(orders.getState().orders[0].notes, issued.notes);
const line = orders.getState().orders[0].lineItems.find((item) => item.orderedQuantity - item.receivedQuantity > 1);
assert.ok(line);
const warehouseId = issued.destinationWarehouseId;
const receive = (items, warehouse = warehouseId) => orders.getState().receiveGoods(issued.id, items, warehouse, "Check receipt");
for (const items of [[], [{ lineItemId: line.id, quantityReceived: 0 }], [{ lineItemId: "missing", quantityReceived: 1 }], [{ lineItemId: line.id, quantityReceived: -1 }], [{ lineItemId: line.id, quantityReceived: NaN }], [{ lineItemId: line.id, quantityReceived: 0.5 }], [{ lineItemId: line.id, quantityReceived: line.orderedQuantity + 1 }], [{ lineItemId: line.id, quantityReceived: 1 }, { lineItemId: line.id, quantityReceived: 1 }]]) {
  unchangedOnError(orders, () => receive(items));
}
unchangedOnError(orders, () => receive([{ lineItemId: line.id, quantityReceived: 1 }], "wrong-warehouse"));
let receiptNotifications = 0;
const stopOrders = orders.subscribe(() => receiptNotifications++);
receive([{ lineItemId: line.id, quantityReceived: 1 }]);
let currentOrder = orders.getState().orders.find((order) => order.id === issued.id);
assert.equal(currentOrder.status, "PARTIALLY_RECEIVED");
assert.equal(currentOrder.lineItems.find((item) => item.id === line.id).receivedQuantity, line.receivedQuantity + 1);
const receiptsBefore = issued.receipts.length;
assert.equal(currentOrder.receipts.length, receiptsBefore + 1);
receive(currentOrder.lineItems.map((item) => ({ lineItemId: item.id, quantityReceived: item.orderedQuantity - item.receivedQuantity })));
currentOrder = orders.getState().orders.find((order) => order.id === issued.id);
assert.equal(currentOrder.status, "RECEIVED");
assert.equal(currentOrder.receipts.length, receiptsBefore + 2);
assert.equal(receiptNotifications, 2);
unchangedOnError(orders, () => receive([{ lineItemId: line.id, quantityReceived: 1 }]));
stopOrders();
assert.deepEqual(isolatedOrders.getState().orders, poSeed);
assert.deepEqual(MOCK_PURCHASE_ORDERS, poSeed);
console.log("Purchase order store checks passed.");

const { createWarehousesStore } = require("../src/features/warehouses/store.ts");
const { MOCK_WAREHOUSES, MOCK_GLOBAL_TRANSFER_LOGS } = require("../src/features/warehouses/mock-data.ts");
const warehouseSeed = structuredClone(MOCK_WAREHOUSES);
const transferSeed = structuredClone(MOCK_GLOBAL_TRANSFER_LOGS);
const warehouses = createWarehousesStore();
const isolatedWarehouses = createWarehousesStore();
const warehouseInput = { name: "Check hub", code: "WH-CHECK", type: "central_hub", status: "active", city: "Jakarta", managerName: "Manager", totalCapacityUnits: 100 };
const createdWarehouse = warehouses.getState().createWarehouse(warehouseInput);
const beforeWarehouseUpdate = warehouses.getState().warehouses;
warehouses.getState().updateWarehouse(createdWarehouse.id, { ...warehouseInput, name: "Updated hub" });
assert.equal(beforeWarehouseUpdate.find((w) => w.id === createdWarehouse.id).name, "Check hub");
assert.equal(warehouses.getState().warehouses.find((w) => w.id === createdWarehouse.id).name, "Updated hub");
unchangedOnError(warehouses, () => warehouses.getState().createWarehouse(warehouseInput));
unchangedOnError(warehouses, () => warehouses.getState().updateWarehouse("missing", warehouseInput));
unchangedOnError(warehouses, () => warehouses.getState().createWarehouse({ ...warehouseInput, code: "INVALID", totalCapacityUnits: -1 }));
const source = warehouses.getState().warehouses.find((w) => w.storedInventory?.some((i) => i.available > 2));
assert.ok(source);
const storedItem = source.storedInventory.find((i) => i.available > 2);
const payload = { sourceWarehouseId: source.id, destinationWarehouseId: createdWarehouse.id, sku: storedItem.sku, itemName: storedItem.name, quantity: 2, reference: "CHECK-TRANSFER", dispatchedBy: "Manager" };
for (const quantity of [0, -1, 0.5, NaN, Infinity, storedItem.available + 1]) {
  unchangedOnError(warehouses, () => warehouses.getState().transferStock({ ...payload, quantity }));
}
unchangedOnError(warehouses, () => warehouses.getState().transferStock({ ...payload, destinationWarehouseId: source.id }));
unchangedOnError(warehouses, () => warehouses.getState().transferStock({ ...payload, sourceWarehouseId: "missing" }));
unchangedOnError(warehouses, () => warehouses.getState().transferStock({ ...payload, sku: "missing" }));
let transferNotifications = 0;
const stopTransfers = warehouses.subscribe(() => transferNotifications++);
const transfer = warehouses.getState().transferStock(payload);
const transfer2 = warehouses.getState().transferStock({ ...payload, quantity: 1 });
assert.equal(transferNotifications, 2, "Both balances and log must publish atomically");
assert.notEqual(transfer.id, transfer2.id);
stopTransfers();
const afterSource = warehouses.getState().warehouses.find((w) => w.id === source.id);
const afterDestination = warehouses.getState().warehouses.find((w) => w.id === createdWarehouse.id);
assert.equal(afterSource.storedInventory.find((i) => i.sku === storedItem.sku)?.quantity ?? 0, storedItem.quantity - 3);
assert.equal(afterDestination.storedInventory.find((i) => i.sku === storedItem.sku).quantity, 3);
assert.equal(warehouses.getState().transferLogs.length, transferSeed.length + 2);
assert.equal(afterSource.transferLogs[0].id, transfer2.id);
assert.equal(afterDestination.transferLogs[0].id, transfer2.id);
warehouses.getState().deleteWarehouse(createdWarehouse.id);
assert.equal(warehouses.getState().warehouses.some((w) => w.id === createdWarehouse.id), false);
unchangedOnError(warehouses, () => warehouses.getState().deleteWarehouse("missing"));
assert.deepEqual(isolatedWarehouses.getState().warehouses, warehouseSeed);
assert.deepEqual(MOCK_WAREHOUSES, warehouseSeed);
assert.deepEqual(MOCK_GLOBAL_TRANSFER_LOGS, transferSeed);
console.log("Warehouse store checks passed.");

const { createSuppliersStore } = require("../src/features/suppliers/store.ts");
const { MOCK_SUPPLIERS } = require("../src/features/suppliers/mock-data.ts");
const supplierSeed = structuredClone(MOCK_SUPPLIERS);
const suppliers = createSuppliersStore();
const isolatedSuppliers = createSuppliersStore();
const supplierInput = { name: "Check supplier", code: "SUP-CHECK", status: "active", tier: "bronze", contactName: "Contact", contactEmail: "check@example.com", contactPhone: "123", street: "Street", city: "Jakarta", province: "Jakarta", postalCode: "10000", paymentTerms: "net_30", leadTimeDays: 7, categories: ["Tools"] };
const createdSupplier = suppliers.getState().createSupplier(supplierInput);
supplierInput.categories.push("Outside mutation");
assert.deepEqual(createdSupplier.categories, ["Tools"]);
const beforeSupplierUpdate = suppliers.getState().suppliers;
suppliers.getState().updateSupplier(createdSupplier.id, { ...supplierInput, name: "Updated supplier" });
assert.equal(beforeSupplierUpdate.find((s) => s.id === createdSupplier.id).name, "Check supplier");
assert.equal(suppliers.getState().suppliers.find((s) => s.id === createdSupplier.id).name, "Updated supplier");
unchangedOnError(suppliers, () => suppliers.getState().createSupplier(supplierInput));
unchangedOnError(suppliers, () => suppliers.getState().updateSupplier("missing", supplierInput));
for (const leadTimeDays of [0, -1, 0.5, NaN, Infinity]) {
  unchangedOnError(suppliers, () => suppliers.getState().createSupplier({ ...supplierInput, code: "INVALID", leadTimeDays }));
}
unchangedOnError(suppliers, () => suppliers.getState().createSupplier({ ...supplierInput, code: "INVALID", categories: [] }));
suppliers.getState().deleteSupplier(createdSupplier.id);
assert.equal(suppliers.getState().suppliers.some((s) => s.id === createdSupplier.id), false);
unchangedOnError(suppliers, () => suppliers.getState().deleteSupplier("missing"));
assert.deepEqual(isolatedSuppliers.getState().suppliers, supplierSeed);
assert.deepEqual(MOCK_SUPPLIERS, supplierSeed);
console.log("Supplier store checks passed.");

for (const factory of [createProductsStore, createInventoryStore, createWarehousesStore, createSuppliersStore, createPurchaseOrdersStore]) {
  assert.equal(factory.length, 0, "Session store factories must not introduce initial-state configuration");
}
assert.equal(inventory.getState().recordMovement.length, 5);
assert.equal(inventory.getState().adjustStock.length, 5);
assert.equal(orders.getState().createPurchaseOrder.length, 1);
assert.equal(orders.getState().receiveGoods.length, 4);
assert.deepEqual(Object.keys(require("../src/features/inventory/schemas/inventory.schema.ts")).sort(), ["AdjustStockSchema", "RecordMovementSchema"]);
assert.deepEqual(Object.keys(require("../src/features/inventory/store.ts")), ["createInventoryStore"]);
unchangedOnError(orders, () => orders.getState().createPurchaseOrder({ supplierId: issued.supplierId, lineItems: issued.lineItems }));
unchangedOnError(orders, () => orders.getState().receiveGoods({ poId: issued.id, receivedItems: [], warehouseId }));
console.log("State migration API checks passed.");
