import type { TallyItem, TallyTotals, CashDiscrepancy, DiscrepancyStatus } from "./types";

export interface MinimalProduct {
  id: string;
  name: string;
  sku: string;
  category?: string;
  unit?: string;
  sellingPrice: string | number;
  currentStock: number;
  stockVersion?: string;
  photo?: { display?: { hash: string }; thumb?: { hash: string } } | { hash: string } | null;
}

/**
 * Add a product to the tally or increment its count if already present.
 */
export function addToTally(items: TallyItem[], product: MinimalProduct): TallyItem[] {
  const existingIndex = items.findIndex((i) => i.productId === product.id);
  const priceNum = typeof product.sellingPrice === "string" ? Number(product.sellingPrice) : product.sellingPrice;

  if (existingIndex >= 0) {
    const updated = [...items];
    const item = updated[existingIndex];
    updated[existingIndex] = {
      ...item,
      quantity: item.quantity + 1,
      availableStock: product.currentStock,
    };
    return updated;
  }

  const photoHash = product.photo
    ? "thumb" in product.photo && product.photo.thumb
      ? product.photo.thumb.hash
      : "hash" in product.photo
      ? product.photo.hash
      : null
    : null;

  const newItem: TallyItem = {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category || "Umum",
    unit: product.unit || "pcs",
    sellingPrice: Number.isFinite(priceNum) ? priceNum : 0,
    quantity: 1,
    availableStock: product.currentStock,
    stockVersion: product.stockVersion,
    photoUrl: photoHash ? `/api/product-photos/thumb/${photoHash}` : null,
  };

  return [...items, newItem];
}

/**
 * Increment quantity of an existing tally item by 1.
 */
export function incrementTally(items: TallyItem[], productId: string): TallyItem[] {
  const existingIndex = items.findIndex((i) => i.productId === productId);
  if (existingIndex < 0) return items;

  const updated = [...items];
  updated[existingIndex] = {
    ...updated[existingIndex],
    quantity: updated[existingIndex].quantity + 1,
  };
  return updated;
}

/**
 * Decrement quantity of a tally item by 1. Removes item if quantity reaches 0.
 */
export function decrementTally(items: TallyItem[], productId: string): TallyItem[] {
  const existingIndex = items.findIndex((i) => i.productId === productId);
  if (existingIndex < 0) return items;

  const item = items[existingIndex];
  if (item.quantity <= 1) {
    return items.filter((_, idx) => idx !== existingIndex);
  }

  const updated = [...items];
  updated[existingIndex] = {
    ...item,
    quantity: item.quantity - 1,
  };
  return updated;
}

/**
 * Set exact quantity of a tally item. Removes item if quantity <= 0.
 */
export function setTallyQuantity(items: TallyItem[], productId: string, quantity: number): TallyItem[] {
  if (quantity <= 0) {
    return items.filter((i) => i.productId !== productId);
  }

  return items.map((item) => {
    if (item.productId === productId) {
      return { ...item, quantity: Math.floor(quantity) };
    }
    return item;
  });
}

/**
 * Completely remove an item from the tally sheet.
 */
export function removeTallyItem(items: TallyItem[], productId: string): TallyItem[] {
  return items.filter((i) => i.productId !== productId);
}

/**
 * Calculate grand totals, expected revenue, and detect any stock overflow.
 */
export function calculateTallyTotals(items: TallyItem[]): TallyTotals {
  let totalQuantity = 0;
  let expectedRevenue = 0;
  const overflowItems: TallyItem[] = [];

  for (const item of items) {
    totalQuantity += item.quantity;
    expectedRevenue += item.quantity * item.sellingPrice;
    if (item.quantity > item.availableStock) {
      overflowItems.push(item);
    }
  }

  return {
    totalQuantity,
    expectedRevenue,
    hasOverflow: overflowItems.length > 0,
    overflowItems,
  };
}

/**
 * Calculate discrepancy between theoretical/expected revenue and actual cash counted.
 */
export function calculateCashDiscrepancy(
  expectedRevenue: number,
  actualCash: number | null | undefined
): CashDiscrepancy {
  if (actualCash === null || actualCash === undefined || !Number.isFinite(actualCash)) {
    return {
      expectedRevenue,
      actualCash: null,
      discrepancy: null,
      status: "unrecorded",
    };
  }

  const discrepancy = actualCash - expectedRevenue;
  let status: DiscrepancyStatus = "balanced";
  if (discrepancy < 0) {
    status = "shortage";
  } else if (discrepancy > 0) {
    status = "surplus";
  }

  return {
    expectedRevenue,
    actualCash,
    discrepancy,
    status,
  };
}

/**
 * Format daily reference code: KASIR-YYYYMMDD
 */
export function formatKasirReference(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `KASIR-${y}${m}${d}`;
}

/**
 * Format audit note recording sales figures and cash count results.
 */
export function formatKasirAuditNote(
  date: Date,
  expectedRevenue: number,
  actualCash: number | null | undefined,
  userNote?: string | null
): string {
  const dayName = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
  const expectedFmt = new Intl.NumberFormat("id-ID").format(expectedRevenue);

  let cashDetail = "Kas fisik tidak dicatat.";
  if (actualCash !== null && actualCash !== undefined && Number.isFinite(actualCash)) {
    const actualFmt = new Intl.NumberFormat("id-ID").format(actualCash);
    const diff = actualCash - expectedRevenue;
    const diffFmt = new Intl.NumberFormat("id-ID").format(Math.abs(diff));

    if (diff === 0) {
      cashDetail = `Kas fisik: Rp${actualFmt} (Sesuai).`;
    } else if (diff < 0) {
      cashDetail = `Kas fisik: Rp${actualFmt} (Kurang Rp${diffFmt}).`;
    } else {
      cashDetail = `Kas fisik: Rp${actualFmt} (Lebih Rp${diffFmt}).`;
    }
  }

  const base = `Penjualan kasir harian ${dayName}. Ekspektasi kas: Rp${expectedFmt}. ${cashDetail}`;
  return userNote ? `${base} Catatan: ${userNote.trim()}` : base;
}
