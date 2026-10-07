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
    setViewMode,
    setPage,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    transferStock,
  } = useWarehouses();

  return (
    <div className="flex flex-col gap-0 pb-12">
      <WarehousesHeader
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTransferModal={() => setIsTransferModalOpen(true, null)}
      />

      <WarehousesMetrics
        metrics={metrics}
      />

      <section className="bg-white border-[3px] border-ink shadow-hard-lg overflow-hidden">
        <WarehousesToolbar
          totalCount={warehouses.length}
          viewMode={filterState.viewMode}
          onViewModeChange={setViewMode}
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
      </section>

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
