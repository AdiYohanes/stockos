"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useWarehouses } from "../hooks/use-warehouses";
import { WarehousesHeader } from "./warehouses-header";
import { WarehousesMetrics } from "./warehouses-metrics";
import { WarehousesToolbar } from "./warehouses-toolbar";
import { WarehouseGridView } from "./warehouse-grid-view";
import { WarehouseTableView } from "./warehouse-table-view";
import { WarehouseFormModal } from "./warehouse-form-modal";
import { StockTransferModal } from "./stock-transfer-modal";
import { DeleteWarehouseDialog } from "./delete-warehouse-dialog";

const WarehouseDetailSheet = dynamic(
  () => import("./warehouse-detail-sheet").then((m) => m.WarehouseDetailSheet),
  { ssr: false }
);

export function WarehousesContainer() {
  const {
    warehouses,
    filterState,
    hasActiveFilters,
    filteredWarehouses,
    paginatedWarehouses,
    totalFilteredCount,
    totalPages,
    metrics,
    selectedWarehouseId,
    selectedWarehouse,
    warehouseToEdit,
    warehouseToDelete,
    isCreateModalOpen,
    isTransferModalOpen,
    transferSourceWarehouseId,
    setSelectedWarehouseId,
    setWarehouseToEdit,
    setWarehouseToDelete,
    setIsCreateModalOpen,
    setIsTransferModalOpen,
    setSearchQuery,
    setStatus,
    setType,
    setViewMode,
    setSorting,
    setPage,
    resetFilters,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    transferStock,
  } = useWarehouses();

  const statusCounts = React.useMemo(() => {
    return {
      all: warehouses.length,
      active: metrics.activeCount,
      maintenance: metrics.maintenanceCount,
      full: metrics.fullCount,
    };
  }, [warehouses.length, metrics.activeCount, metrics.maintenanceCount, metrics.fullCount]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      <WarehousesHeader
        totalCount={warehouses.length}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTransferModal={() => setIsTransferModalOpen(true, null)}
      />

      <WarehousesMetrics
        metrics={metrics}
        selectedStatus={filterState.status}
        onSelectStatus={setStatus}
      />

      <WarehousesToolbar
        filterState={filterState}
        hasActiveFilters={hasActiveFilters}
        totalFilteredCount={totalFilteredCount}
        statusCounts={statusCounts}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatus}
        onTypeChange={setType}
        onViewModeChange={setViewMode}
        onSortChange={setSorting}
        onResetFilters={resetFilters}
      />

      {filterState.viewMode === "grid" ? (
        <WarehouseGridView
          warehouses={filteredWarehouses}
          onSelectWarehouse={(id) => setSelectedWarehouseId(id)}
          onOpenTransferModal={(id) => setIsTransferModalOpen(true, id)}
          onEditWarehouse={(wh) => setWarehouseToEdit(wh)}
          onDeleteWarehouse={(wh) => setWarehouseToDelete(wh)}
        />
      ) : (
        <WarehouseTableView
          warehouses={paginatedWarehouses}
          currentPage={filterState.page}
          totalPages={totalPages}
          totalFilteredCount={totalFilteredCount}
          onPageChange={setPage}
          onSelectWarehouse={(id) => setSelectedWarehouseId(id)}
          onOpenTransferModal={(id) => setIsTransferModalOpen(true, id)}
          onEditWarehouse={(wh) => setWarehouseToEdit(wh)}
          onDeleteWarehouse={(wh) => setWarehouseToDelete(wh)}
        />
      )}

      {selectedWarehouseId && (
        <WarehouseDetailSheet
          warehouse={selectedWarehouse}
          open={!!selectedWarehouseId}
          onClose={() => setSelectedWarehouseId(null)}
          onOpenTransferModal={(id) => {
            setIsTransferModalOpen(true, id);
          }}
          onEditWarehouse={(wh) => {
            setWarehouseToEdit(wh);
          }}
        />
      )}

      <WarehouseFormModal
        key={warehouseToEdit?.id || "new-wh"}
        warehouse={warehouseToEdit}
        open={isCreateModalOpen || !!warehouseToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setWarehouseToEdit(null);
        }}
        onSave={(data) => {
          if (warehouseToEdit) {
            updateWarehouse(warehouseToEdit.id, data);
          } else {
            createWarehouse(data);
          }
        }}
      />

      <StockTransferModal
        open={isTransferModalOpen}
        warehouses={warehouses}
        initialSourceWarehouseId={transferSourceWarehouseId}
        onClose={() => setIsTransferModalOpen(false, null)}
        onTransfer={transferStock}
      />

      <DeleteWarehouseDialog
        warehouse={warehouseToDelete}
        open={!!warehouseToDelete}
        onClose={() => setWarehouseToDelete(null)}
        onConfirm={(id) => deleteWarehouse(id)}
      />
    </div>
  );
}
