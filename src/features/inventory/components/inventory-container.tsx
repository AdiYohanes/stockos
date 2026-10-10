"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { useInventory, INITIAL_INVENTORY_FILTER_STATE } from "../hooks/use-inventory";
import { InventoryHeader } from "./inventory-header";
import { InventoryMetricsView } from "./inventory-metrics";
import { InventoryToolbar } from "./inventory-toolbar";
import { InventoryTabs } from "./inventory-tabs";
import { InventoryStockTable } from "./inventory-stock-table";
import { InventoryMovementsTable } from "./inventory-movements-table";
import { StockMovementModal } from "./stock-movement-modal";
import { StockAdjustmentModal } from "./stock-adjustment-modal";
import { mapProductToInventoryItem, mapEventToStockMovement } from "../adapters";
import type { InventoryFilterState, InventoryItem, InventoryMetrics, StockMovement } from "../types";
import type { ProductDto, ProductsPage, ProductMetrics, ProductFailure } from "@/features/products/schemas/product-rpc.schema";
import type { InventoryEventsPage } from "../schemas/inventory-rpc.schema";

const InventoryDetailSheet = dynamic(
  () => import("./inventory-detail-sheet").then((m) => m.InventoryDetailSheet),
  { ssr: false }
);

export interface InventoryContainerProps {
  filterState?: InventoryFilterState;
  stockPage?: ProductsPage | null;
  eventsPage?: InventoryEventsPage | null;
  metrics?: ProductMetrics | null;
  categories?: string[];
  failure?: ProductFailure | null;
  totalProductsCount?: number;
  totalEventsCount?: number;
}

export function InventoryContainer({
  filterState = INITIAL_INVENTORY_FILTER_STATE,
  stockPage = null,
  eventsPage = null,
  metrics = null,
  categories = [],
  failure = null,
  totalProductsCount = 0,
  totalEventsCount = 0,
}: InventoryContainerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const p = t.products.persistent;

  const filters = useInventory(filterState);

  // Derived UI data from server props
  const inventoryItems: InventoryItem[] = React.useMemo(() => {
    return stockPage ? stockPage.items.map(mapProductToInventoryItem) : [];
  }, [stockPage]);

  const stockMovements: StockMovement[] = React.useMemo(() => {
    return eventsPage ? eventsPage.items.map(mapEventToStockMovement) : [];
  }, [eventsPage]);

  const rawProducts: ProductDto[] = React.useMemo(() => {
    return stockPage?.items || [];
  }, [stockPage]);

  const computedMetrics: InventoryMetrics = React.useMemo(() => {
    const totalItems = metrics?.totalProducts ?? totalProductsCount;
    const totalValuation = metrics?.totalValuation ? parseFloat(metrics.totalValuation) : 0;
    const lowStockCount = metrics?.lowStockCount ?? 0;
    const outOfStockCount = metrics?.outOfStockCount ?? 0;
    const totalQuantity = stockPage?.items.reduce((sum, item) => sum + item.currentStock, 0) ?? 0;

    return {
      totalItems,
      totalQuantity,
      lowStockCount,
      outOfStockCount,
      overstockedCount: 0,
      totalValuation,
      todayMovementsCount: totalEventsCount,
    };
  }, [metrics, totalProductsCount, stockPage, totalEventsCount]);

  // Selection & Modals
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const selectedItem = React.useMemo(() => {
    if (!selectedItemId) return null;
    return inventoryItems.find((i) => i.id === selectedItemId) || null;
  }, [inventoryItems, selectedItemId]);

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

  const handleCommitted = async () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-0 pb-12" aria-busy={filters.pending}>
      <InventoryHeader
        searchQuery={filterState.searchQuery}
        onSearchChange={filters.setSearchQuery}
        onOpenMovementModal={() => handleOpenMovementModal()}
        onOpenAdjustmentModal={() => handleOpenAdjustmentModal()}
      />

      {failure && (
        <div role="alert" className="border-[3px] border-ink bg-rose-50 p-3 mb-6 flex items-center justify-between">
          <p className="text-xs font-mono font-bold text-rose-700">
            {p.errors[failure.code] || t.common.error}
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="press bg-white border-[2px] border-ink px-3 py-1 text-xs font-mono font-bold uppercase shadow-hard-sm"
          >
            {p.retry}
          </button>
        </div>
      )}

      {filters.pending && (
        <p role="status" className="font-mono text-xs text-ink/60 mb-2">
          {t.common.loading}...
        </p>
      )}

      <InventoryMetricsView
        metrics={computedMetrics}
        selectedStatus={filterState.status}
        onSelectStatus={filters.setStatus}
        onSelectTab={filters.setTab}
      />

      <InventoryToolbar totalItems={computedMetrics.totalItems} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <InventoryTabs
          activeTab={filterState.tab}
          onTabChange={filters.setTab}
          stockCount={totalProductsCount}
          movementsCount={totalEventsCount}
        />

        {categories.length > 0 && filterState.tab === "stock_levels" && (
          <div className="flex items-center gap-2">
            <label htmlFor="inventoryCategorySelect" className="font-mono text-[10px] uppercase font-bold text-ink/70">
              {t.common.category}:
            </label>
            <select
              id="inventoryCategorySelect"
              value={filterState.category}
              onChange={(e) => filters.setCategory(e.target.value)}
              className="h-9 border-[3px] border-ink bg-white px-2.5 font-mono text-xs font-bold uppercase text-ink shadow-hard-sm"
            >
              <option value="all">ALL CATEGORIES</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <section className="bg-white border-[3px] border-ink shadow-hard-lg overflow-hidden">
        {filterState.tab === "stock_levels" ? (
          <InventoryStockTable
            items={inventoryItems}
            totalCount={stockPage?.total ?? inventoryItems.length}
            filterState={filterState}
            hasActiveFilters={filters.hasActiveFilters}
            onPageChange={filters.setPage}
            onResetFilters={filters.resetFilters}
            onSelectItem={(item) => setSelectedItemId(item.id)}
            onAdjustItem={(item) => handleOpenAdjustmentModal(item)}
            onQuickMove={(item, moveType) => handleOpenMovementModal(item, moveType)}
          />
        ) : (
          <InventoryMovementsTable
            movements={stockMovements}
            totalCount={eventsPage?.total ?? stockMovements.length}
            filterState={filterState}
            hasActiveFilters={filters.hasActiveFilters}
            onPageChange={filters.setPage}
            onResetFilters={filters.resetFilters}
          />
        )}
      </section>

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
        allItems={inventoryItems}
        rawProducts={rawProducts}
        onCommitted={handleCommitted}
      />

      <StockAdjustmentModal
        key={adjustmentModalState.targetItem?.id || "new-adjust"}
        open={adjustmentModalState.open}
        onOpenChange={(open) => setAdjustmentModalState((prev) => ({ ...prev, open }))}
        targetItem={adjustmentModalState.targetItem}
        allItems={inventoryItems}
        rawProducts={rawProducts}
        onCommitted={handleCommitted}
      />
    </div>
  );
}
