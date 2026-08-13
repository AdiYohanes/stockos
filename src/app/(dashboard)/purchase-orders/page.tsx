"use client";

import * as React from "react";
import {
  usePurchaseOrders,
  PurchaseOrdersHeader,
  PurchaseOrdersMetricCards,
  PurchaseOrdersToolbar,
  PurchaseOrdersTable,
  CreatePOModal,
  ReceiveGoodsModal,
  PODetailSheet,
} from "@/features/purchase-orders";

export default function PurchaseOrdersPage() {
  const {
    orders,
    rawOrders,
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
  } = usePurchaseOrders();

  const selectedPo = React.useMemo(() => {
    return rawOrders.find((o) => o.id === selectedPoId) || null;
  }, [rawOrders, selectedPoId]);

  const receivingPo = React.useMemo(() => {
    return rawOrders.find((o) => o.id === receivingPoId) || null;
  }, [rawOrders, receivingPoId]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <PurchaseOrdersHeader onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Metric Cards */}
      <PurchaseOrdersMetricCards
        metrics={metrics}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Toolbar */}
      <PurchaseOrdersToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSupplier={selectedSupplier}
        onSupplierChange={setSelectedSupplier}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        onResetFilters={handleResetFilters}
        orders={rawOrders}
      />

      {/* High-Density Data Table */}
      <PurchaseOrdersTable
        orders={orders}
        onInspect={(poId) => setSelectedPoId(poId)}
        onReceiveGoods={(poId) => setReceivingPoId(poId)}
      />

      {/* Modals & Inspection Sheet */}
      <CreatePOModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePo}
      />

      <ReceiveGoodsModal
        po={receivingPo}
        isOpen={!!receivingPoId}
        onClose={() => setReceivingPoId(null)}
        onConfirmReceive={handleReceiveGoods}
      />

      <PODetailSheet
        po={selectedPo}
        isOpen={!!selectedPoId}
        onClose={() => setSelectedPoId(null)}
      />
    </div>
  );
}
