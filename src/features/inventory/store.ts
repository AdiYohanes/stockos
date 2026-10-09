import { createStore } from "zustand/vanilla";
import { MOCK_INVENTORY_ITEMS, MOCK_STOCK_MOVEMENTS } from "./mock-data";
import type {
  AdjustmentReason,
  InventoryItem,
  StockMovement,
  StockStatus,
} from "./types";
import {
  RecordMovementSchema,
  AdjustStockSchema,
} from "./schemas/inventory.schema";

function calculateStockStatus(
  currentStock: number,
  minStock: number,
  maxStock: number
): StockStatus {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minStock) return "low_stock";
  if (currentStock > maxStock) return "overstocked";
  return "in_stock";
}

export interface InventoryState {
  items: InventoryItem[];
  movements: StockMovement[];
}

export interface InventoryActions {
  recordMovement: (
    itemId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => StockMovement;
  adjustStock: (
    itemId: string,
    newStock: number,
    reason: AdjustmentReason,
    reference: string,
    note?: string
  ) => StockMovement;
}

export type InventoryStore = InventoryState & InventoryActions;

export const createInventoryStore = () => {
  return createStore<InventoryStore>((set, get) => ({
    items: structuredClone(MOCK_INVENTORY_ITEMS),
    movements: structuredClone(MOCK_STOCK_MOVEMENTS),

    recordMovement: (itemId, type, quantity, reference, note) => {
      const parsed = RecordMovementSchema.safeParse({
        itemId,
        type,
        quantity,
        reference,
        note,
      });

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "Invalid stock movement parameters");
      }

      const { items, movements } = get();
      const targetItem = items.find((i) => i.id === parsed.data.itemId);
      if (!targetItem) {
        throw new Error(`Inventory item with ID "${parsed.data.itemId}" not found`);
      }

      if (parsed.data.type === "out" && parsed.data.quantity > targetItem.availableStock) {
        throw new Error(
          `Cannot dispatch ${parsed.data.quantity} ${targetItem.unit}. Available stock is ${targetItem.availableStock} ${targetItem.unit}`
        );
      }

      const previousStock = targetItem.currentStock;
      const delta = parsed.data.type === "in" ? parsed.data.quantity : -parsed.data.quantity;
      const newStock = previousStock + delta;
      if (!Number.isSafeInteger(newStock) || newStock < 0) {
        throw new Error("Stock level must remain a non-negative safe integer");
      }

      const newAvailable = Math.max(0, newStock - targetItem.reservedStock);
      const newStatus = calculateStockStatus(newStock, targetItem.minStock, targetItem.maxStock);
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);

      const movement: StockMovement = {
        id: `mov-${crypto.randomUUID()}`,
        itemId: targetItem.id,
        sku: targetItem.sku,
        itemName: targetItem.name,
        type: parsed.data.type,
        quantity: delta,
        previousStock,
        newStock,
        reference: parsed.data.reference,
        note: parsed.data.note,
        performedBy: "Alex Morgan",
        timestamp,
      };

      set({
        items: items.map((i) =>
          i.id === targetItem.id
            ? {
                ...i,
                currentStock: newStock,
                availableStock: newAvailable,
                status: newStatus,
                lastMovementAt: timestamp,
              }
            : i
        ),
        movements: [movement, ...movements],
      });

      return movement;
    },

    adjustStock: (itemId, newStock, reason, reference, note) => {
      const parsed = AdjustStockSchema.safeParse({
        itemId,
        newStock,
        reason,
        reference,
        note,
      });

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "Invalid stock adjustment parameters");
      }

      const { items, movements } = get();
      const targetItem = items.find((i) => i.id === parsed.data.itemId);
      if (!targetItem) {
        throw new Error(`Inventory item with ID "${parsed.data.itemId}" not found`);
      }

      const previousStock = targetItem.currentStock;
      const delta = parsed.data.newStock - previousStock;
      if (delta === 0) {
        throw new Error("New stock quantity is identical to current stock. No adjustment needed.");
      }

      const newAvailable = Math.max(0, parsed.data.newStock - targetItem.reservedStock);
      const newStatus = calculateStockStatus(parsed.data.newStock, targetItem.minStock, targetItem.maxStock);
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);

      const movement: StockMovement = {
        id: `mov-${crypto.randomUUID()}`,
        itemId: targetItem.id,
        sku: targetItem.sku,
        itemName: targetItem.name,
        type: "adjustment",
        quantity: delta,
        previousStock,
        newStock: parsed.data.newStock,
        reference: parsed.data.reference,
        reason: parsed.data.reason,
        note: parsed.data.note,
        performedBy: "Alex Morgan",
        timestamp,
      };

      set({
        items: items.map((i) =>
          i.id === targetItem.id
            ? {
                ...i,
                currentStock: parsed.data.newStock,
                availableStock: newAvailable,
                status: newStatus,
                lastMovementAt: timestamp,
              }
            : i
        ),
        movements: [movement, ...movements],
      });

      return movement;
    },
  }));
};
