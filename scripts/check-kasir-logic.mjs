import assert from "node:assert/strict";

/**
 * Unit test for Kasir Harian pure logic and tally operations.
 * Tests domain invariants, overflow calculation, cash discrepancy calculation.
 */

const {
  addToTally,
  decrementTally,
  setTallyQuantity,
  removeTallyItem,
  calculateTallyTotals,
  calculateCashDiscrepancy,
  formatKasirAuditNote,
  formatKasirReference,
} = await import("../src/features/kasir/tally.ts");

console.log("Running Kasir tally logic checks...");

// Fixtures
const pIndomie = {
  id: "prod-1",
  name: "Indomie Goreng",
  sku: "PLU-2236",
  sellingPrice: "3500",
  currentStock: 10,
  photo: null,
};

const pTeh = {
  id: "prod-2",
  name: "Teh Botol Sosro",
  sku: "PLU-3239",
  sellingPrice: "5000",
  currentStock: 2,
  photo: null,
};

// 1. addToTally: Add new and increment existing
let tally = [];
tally = addToTally(tally, pIndomie);
assert.equal(tally.length, 1);
assert.equal(tally[0].quantity, 1);
assert.equal(tally[0].sellingPrice, 3500);

tally = addToTally(tally, pIndomie);
assert.equal(tally.length, 1);
assert.equal(tally[0].quantity, 2);

tally = addToTally(tally, pTeh);
assert.equal(tally.length, 2);
assert.equal(tally[1].quantity, 1);

// 2. decrementTally: decrement quantity and remove if reaches 0
tally = decrementTally(tally, "prod-1");
assert.equal(tally.find((i) => i.productId === "prod-1").quantity, 1);

tally = decrementTally(tally, "prod-1");
assert.equal(tally.find((i) => i.productId === "prod-1"), undefined);
assert.equal(tally.length, 1); // Only pTeh left

// 3. setTallyQuantity: direct update and validation
tally = addToTally(tally, pIndomie);
tally = setTallyQuantity(tally, "prod-1", 5);
assert.equal(tally.find((i) => i.productId === "prod-1").quantity, 5);

tally = setTallyQuantity(tally, "prod-1", 0);
assert.equal(tally.find((i) => i.productId === "prod-1"), undefined);

// 4. removeTallyItem
tally = addToTally(tally, pIndomie);
tally = removeTallyItem(tally, "prod-1");
assert.equal(tally.find((i) => i.productId === "prod-1"), undefined);

// 5. calculateTallyTotals & overflow check
// pTeh has currentStock: 2, quantity: 1
tally = setTallyQuantity(tally, "prod-2", 2);
let totals = calculateTallyTotals(tally);
assert.equal(totals.totalQuantity, 2);
assert.equal(totals.expectedRevenue, 10000);
assert.equal(totals.hasOverflow, false);
assert.equal(totals.overflowItems.length, 0);

// Overflow: order 5 when stock is 2
tally = setTallyQuantity(tally, "prod-2", 5);
totals = calculateTallyTotals(tally);
assert.equal(totals.totalQuantity, 5);
assert.equal(totals.hasOverflow, true);
assert.equal(totals.overflowItems.length, 1);
assert.equal(totals.overflowItems[0].productId, "prod-2");

// 6. calculateCashDiscrepancy
// Match: expected 10000, physical 10000
const match = calculateCashDiscrepancy(10000, 10000);
assert.equal(match.discrepancy, 0);
assert.equal(match.status, "balanced");

// Shortage: expected 10000, physical 8000 -> -2000
const short = calculateCashDiscrepancy(10000, 8000);
assert.equal(short.discrepancy, -2000);
assert.equal(short.status, "shortage");

// Surplus: expected 10000, physical 12000 -> +2000
const over = calculateCashDiscrepancy(10000, 12000);
assert.equal(over.discrepancy, 2000);
assert.equal(over.status, "surplus");

// Unspecified physical cash (null)
const unspec = calculateCashDiscrepancy(10000, null);
assert.equal(unspec.discrepancy, null);
assert.equal(unspec.status, "unrecorded");

// 7. formatKasirReference & formatKasirAuditNote
const testDate = new Date("2026-11-03T10:00:00Z");
const ref = formatKasirReference(testDate);
assert.match(ref, /^KASIR-\d{8}$/);

const noteBalanced = formatKasirAuditNote(testDate, 35000, 35000);
assert.ok(noteBalanced.includes("35.000"));
assert.ok(noteBalanced.includes("Sesuai"));

const noteShort = formatKasirAuditNote(testDate, 35000, 30000);
assert.ok(noteShort.includes("Kurang"));

console.log("Kasir tally logic checks passed!");
