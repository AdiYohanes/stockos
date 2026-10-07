import { createStore } from "zustand/vanilla";
import { MOCK_PURCHASE_ORDERS } from "./mock-data";
import {
  PurchaseOrderSchema,
  type PurchaseOrder,
  type POStatus,
  type POReceiptLog,
} from "./schemas/po.schema";

export interface PurchaseOrdersState {
  orders: PurchaseOrder[];
}

export interface PurchaseOrdersActions {
  createPurchaseOrder: (newPo: PurchaseOrder) => PurchaseOrder;
  receiveGoods: (
    poId: string,
    receivedItems: { lineItemId: string; quantityReceived: number }[],
    warehouseId: string,
    notes?: string
  ) => POReceiptLog;
}

export type PurchaseOrdersStore = PurchaseOrdersState & PurchaseOrdersActions;

export const createPurchaseOrdersStore = () => {
  return createStore<PurchaseOrdersStore>((set, get) => ({
    orders: structuredClone(MOCK_PURCHASE_ORDERS),

    createPurchaseOrder: (newPo) => {
      const validated = PurchaseOrderSchema.safeParse(newPo);
      if (!validated.success) {
        throw new Error(validated.error.issues[0]?.message || "Invalid purchase order");
      }

      const order = validated.data;
      if (!order.id.trim() || new Set(order.lineItems.map((item) => item.id)).size !== order.lineItems.length ||
          order.lineItems.some((item) => !item.id.trim() || item.receivedQuantity > item.orderedQuantity)) {
        throw new Error("Purchase order requires unique line IDs and valid received quantities");
      }
      const { orders } = get();
      if (orders.some((o) => o.id === order.id || o.poNumber === order.poNumber)) {
        throw new Error(`Purchase order with ID "${validated.data.id}" already exists`);
      }

      set({
        orders: [validated.data, ...orders],
      });

      return validated.data;
    },

    receiveGoods: (poId, receivedItems, warehouseId, notes) => {
      if (!receivedItems || receivedItems.length === 0) {
        throw new Error("Received items list cannot be empty");
      }

      const seenLineIds = new Set<string>();
      for (const item of receivedItems) {
        if (seenLineIds.has(item.lineItemId)) {
          throw new Error(`Duplicate line item ID in received items: "${item.lineItemId}"`);
        }
        seenLineIds.add(item.lineItemId);
      }

      const totalReceivedNow = receivedItems.reduce((sum, i) => sum + i.quantityReceived, 0);
      if (totalReceivedNow <= 0) {
        throw new Error("Receipt must contain at least one item with quantity greater than zero");
      }

      const { orders } = get();
      const targetPo = orders.find((o) => o.id === poId);
      if (!targetPo) {
        throw new Error(`Purchase order with ID "${poId}" not found`);
      }

      if (targetPo.status !== "ISSUED" && targetPo.status !== "PARTIALLY_RECEIVED") {
        throw new Error(
          `Cannot receive goods for purchase order with status "${targetPo.status}". Only ISSUED or PARTIALLY_RECEIVED orders allowed.`
        );
      }

      if (warehouseId !== targetPo.destinationWarehouseId) {
        throw new Error(
          `Invalid receiving warehouse "${warehouseId}". Goods must be received at destination warehouse "${targetPo.destinationWarehouseId}".`
        );
      }

      const poLineItemMap = new Map(targetPo.lineItems.map((li) => [li.id, li]));
      for (const item of receivedItems) {
        const poLine = poLineItemMap.get(item.lineItemId);
        if (!poLine) {
          throw new Error(`Line item with ID "${item.lineItemId}" does not belong to purchase order "${poId}"`);
        }

        if (!Number.isSafeInteger(item.quantityReceived) || item.quantityReceived < 0) {
          throw new Error(`Received quantity for line item "${item.lineItemId}" must be a non-negative integer`);
        }

        const remaining = poLine.orderedQuantity - poLine.receivedQuantity;
        if (item.quantityReceived > remaining) {
          throw new Error(
            `Received quantity (${item.quantityReceived}) exceeds remaining quantity (${remaining}) for SKU "${poLine.sku}"`
          );
        }
      }

      let totalOrdered = 0;
      let totalReceivedAfter = 0;

      const updatedLineItems = targetPo.lineItems.map((item) => {
        const match = receivedItems.find((r) => r.lineItemId === item.id);
        const addedQty = match ? match.quantityReceived : 0;
        const newReceivedQty = item.receivedQuantity + addedQty;

        totalOrdered += item.orderedQuantity;
        totalReceivedAfter += newReceivedQty;

        return {
          ...item,
          receivedQuantity: newReceivedQty,
        };
      });

      const newStatus: POStatus =
        totalReceivedAfter >= totalOrdered ? "RECEIVED" : "PARTIALLY_RECEIVED";

      const receipt: POReceiptLog = {
        id: `rc-${crypto.randomUUID()}`,
        poId: targetPo.id,
        receivedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        warehouseId,
        warehouseName: targetPo.destinationWarehouseName,
        items: updatedLineItems
          .filter((item) => {
            const match = receivedItems.find((r) => r.lineItemId === item.id);
            return match && match.quantityReceived > 0;
          })
          .map((item) => {
            const match = receivedItems.find((r) => r.lineItemId === item.id)!;
            return {
              sku: item.sku,
              productName: item.productName,
              quantityReceived: match.quantityReceived,
            };
          }),
        notes,
      };

      const updatedPo: PurchaseOrder = {
        ...targetPo,
        status: newStatus,
        lineItems: updatedLineItems,
        receipts: [receipt, ...targetPo.receipts],
      };

      set({
        orders: orders.map((o) => (o.id === poId ? updatedPo : o)),
      });

      return receipt;
    },
  }));
};
