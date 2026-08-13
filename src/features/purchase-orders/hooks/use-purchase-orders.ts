"use client";

import * as React from "react";
import { MOCK_PURCHASE_ORDERS } from "../mock-data";
import type { PurchaseOrder, POStatus, POSummaryMetrics } from "../types";

export function usePurchaseOrders() {
  const [orders, setOrders] = React.useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = React.useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<string>("all");
  const [selectedPoId, setSelectedPoId] = React.useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState<boolean>(false);
  const [receivingPoId, setReceivingPoId] = React.useState<string | null>(null);

  // Filter logic
  const filteredOrders = React.useMemo(() => {
    return orders.filter((po) => {
      // Tab filter
      if (activeTab !== "all") {
        if (activeTab === "pending" && po.status !== "ISSUED") return false;
        if (activeTab === "partial" && po.status !== "PARTIALLY_RECEIVED") return false;
        if (activeTab === "received" && po.status !== "RECEIVED") return false;
        if (activeTab === "draft" && po.status !== "DRAFT") return false;
        if (activeTab === "cancelled" && po.status !== "CANCELLED") return false;
      }

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesCode = po.poNumber.toLowerCase().includes(q);
        const matchesSupplier = po.supplierName.toLowerCase().includes(q);
        const matchesSku = po.lineItems.some((item) =>
          item.sku.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q)
        );
        if (!matchesCode && !matchesSupplier && !matchesSku) return false;
      }

      // Supplier filter
      if (selectedSupplier !== "all" && po.supplierId !== selectedSupplier) return false;

      // Warehouse filter
      if (selectedWarehouse !== "all" && po.destinationWarehouseId !== selectedWarehouse) return false;

      return true;
    });
  }, [orders, activeTab, searchQuery, selectedSupplier, selectedWarehouse]);

  // Derived Summary Metrics
  const metrics: POSummaryMetrics = React.useMemo(() => {
    const totalOrders = orders.length;
    const totalSpend = orders.reduce((sum, po) => sum + po.totalCost, 0);
    const pendingCount = orders.filter((po) => po.status === "ISSUED").length;
    const partialCount = orders.filter((po) => po.status === "PARTIALLY_RECEIVED").length;
    const receivedCount = orders.filter((po) => po.status === "RECEIVED").length;

    return { totalOrders, totalSpend, pendingCount, partialCount, receivedCount };
  }, [orders]);

  // Handlers
  const handleResetFilters = React.useCallback(() => {
    setActiveTab("all");
    setSearchQuery("");
    setSelectedSupplier("all");
    setSelectedWarehouse("all");
  }, []);

  const handleCreatePo = React.useCallback((newPo: PurchaseOrder) => {
    setOrders((prev) => [newPo, ...prev]);
    setIsCreateModalOpen(false);
  }, []);

  const handleReceiveGoods = React.useCallback(
    (poId: string, receivedItems: { lineItemId: string; quantityReceived: number }[], warehouseId: string, notes?: string) => {
      setOrders((prev) =>
        prev.map((po) => {
          if (po.id !== poId) return po;

          // Update line items received qty
          let totalOrdered = 0;
          let totalReceivedAfter = 0;

          const updatedLineItems = po.lineItems.map((item) => {
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

          // Determine new status
          let newStatus: POStatus = po.status;
          if (totalReceivedAfter >= totalOrdered) {
            newStatus = "RECEIVED";
          } else if (totalReceivedAfter > 0) {
            newStatus = "PARTIALLY_RECEIVED";
          }

          // Create new receipt log entry
          const newReceipt = {
            id: `rc-${Date.now()}`,
            poId,
            receivedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
            warehouseId,
            warehouseName: po.destinationWarehouseName,
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

          return {
            ...po,
            status: newStatus,
            lineItems: updatedLineItems,
            receipts: [newReceipt, ...po.receipts],
          };
        })
      );
      setReceivingPoId(null);
    },
    []
  );

  return {
    orders: filteredOrders,
    rawOrders: orders,
    metrics,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedSupplier,
    setSelectedSupplier,
    selectedWarehouse,
    setSelectedWarehouse,
    selectedPoId,
    setSelectedPoId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    receivingPoId,
    setReceivingPoId,
    handleResetFilters,
    handleCreatePo,
    handleReceiveGoods,
  };
}
