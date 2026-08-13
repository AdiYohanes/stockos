"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useInventory } from "../hooks/use-inventory";
import { InventoryHeader } from "./inventory-header";
import { InventoryMetricsView } from "./inventory-metrics";
import { InventoryTabs } from "./inventory-tabs";
import { InventoryToolbar } from "./inventory-toolbar";
import { InventoryStockTable } from "./inventory-stock-table";
import { InventoryMovementsTable } from "./inventory-movements-table";
import { StockMovementModal } from "./stock-movement-modal";
import { StockAdjustmentModal } from "./stock-adjustment-modal";
import type { InventoryItem } from "../types";

const InventoryDetailSheet = dynamic(
  () => import("./inventory-detail-sheet").then((m) => m.InventoryDetailSheet),
  { ssr: false }
);

export function InventoryContainer() {
  const {
    items,
    tab,
    filterState,
    hasActiveFilters,

    paginatedItems,
    totalFilteredItemsCount,

    paginatedMovements,
    totalFilteredMovementsCount,

    metrics,

    selectedItemId,
    selectedItem,

    setTab,
    setSelectedItemId,
    setSearchQuery,
    setWarehouse,
    setStatus,
    setMovementType,
    setCategory,
    setSorting,
    setPage,
    resetFilters,

    recordMovement,
    adjustStock,
  } = useInventory();

  const [movementModalState, setMovementModalState] = React.useState<{
    open: boolean;
    targetItem: InventoryItem | null;
    type: "in" | "out" | null;
  }>({
    open: false,
    targetItem: null,
    type: null,
  });

  const [adjustmentModalState, setAdjustmentModalState] = React.useState<{
    open: boolean;
    targetItem: InventoryItem | null;
  }>({
    open: false,
    targetItem: null,
  });

  const warehouses = React.useMemo(() => {
    return Array.from(new Set(items.map((i) => i.warehouse)));
  }, [items]);

  const categories = React.useMemo(() => {
    return Array.from(new Set(items.map((i) => i.category)));
  }, [items]);

  const handleOpenMovementModal = (item?: InventoryItem, type?: "in" | "out") => {
    setMovementModalState({
      open: true,
      targetItem: item || null,
      type: type || "in",
    });
  };

  const handleOpenAdjustmentModal = (item?: InventoryItem) => {
    setAdjustmentModalState({
      open: true,
      targetItem: item || null,
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[1600px] mx-auto pb-12">
      <InventoryHeader
        totalItems={metrics.totalItems}
        onOpenMovementModal={() => handleOpenMovementModal()}
        onOpenAdjustmentModal={() => handleOpenAdjustmentModal()}
      />

      <InventoryMetricsView
        metrics={metrics}
        selectedStatus={filterState.status}
        onSelectStatus={setStatus}
        onSelectTab={setTab}
      />

      <InventoryTabs
        activeTab={tab}
        onTabChange={setTab}
        stockCount={totalFilteredItemsCount}
        movementsCount={totalFilteredMovementsCount}
      />

      <InventoryToolbar
        filterState={filterState}
        hasActiveFilters={hasActiveFilters}
        warehouses={warehouses}
        categories={categories}
        onSearchChange={setSearchQuery}
        onWarehouseChange={setWarehouse}
        onStatusChange={setStatus}
        onMovementTypeChange={setMovementType}
        onCategoryChange={setCategory}
        onSortChange={setSorting}
        onResetFilters={resetFilters}
      />

      {tab === "stock_levels" ? (
        <InventoryStockTable
          items={paginatedItems}
          totalCount={totalFilteredItemsCount}
          filterState={filterState}
          hasActiveFilters={hasActiveFilters}
          onPageChange={setPage}
          onResetFilters={resetFilters}
          onSelectItem={(item) => setSelectedItemId(item.id)}
          onAdjustItem={(item) => handleOpenAdjustmentModal(item)}
          onQuickMove={(item, moveType) => handleOpenMovementModal(item, moveType)}
        />
      ) : (
        <InventoryMovementsTable
          movements={paginatedMovements}
          totalCount={totalFilteredMovementsCount}
          filterState={filterState}
          hasActiveFilters={hasActiveFilters}
          onPageChange={setPage}
          onResetFilters={resetFilters}
        />
      )}

      {selectedItemId && (
        <InventoryDetailSheet
          item={selectedItem}
          open={selectedItemId !== null}
          onClose={() => setSelectedItemId(null)}
          onAdjustStock={(item) => {
            setSelectedItemId(null);
            handleOpenAdjustmentModal(item);
          }}
          onQuickMove={(item, moveType) => {
            setSelectedItemId(null);
            handleOpenMovementModal(item, moveType);
          }}
        />
      )}

      <StockMovementModal
        key={movementModalState.targetItem?.id || "new-move"}
        open={movementModalState.open}
        onOpenChange={(open) => setMovementModalState((prev) => ({ ...prev, open }))}
        targetItem={movementModalState.targetItem}
        defaultType={movementModalState.type}
        allItems={items}
        onRecordMovement={recordMovement}
      />

      <StockAdjustmentModal
        key={adjustmentModalState.targetItem?.id || "new-adjust"}
        open={adjustmentModalState.open}
        onOpenChange={(open) => setAdjustmentModalState((prev) => ({ ...prev, open }))}
        targetItem={adjustmentModalState.targetItem}
        allItems={items}
        onAdjustStock={adjustStock}
      />
    </div>
  );
}
