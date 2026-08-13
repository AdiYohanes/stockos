"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSuppliers } from "../hooks/use-suppliers";
import { SuppliersHeader } from "./suppliers-header";
import { SuppliersMetrics } from "./suppliers-metrics";
import { SuppliersToolbar } from "./suppliers-toolbar";
import { SuppliersTable } from "./suppliers-table";
import { SupplierFormModal } from "./supplier-form-modal";
import { DeleteSupplierDialog } from "./delete-supplier-dialog";

const SupplierDetailSheet = dynamic(
  () => import("./supplier-detail-sheet").then((m) => m.SupplierDetailSheet),
  { ssr: false }
);

export function SuppliersContainer() {
  const {
    suppliers,
    filterState,
    hasActiveFilters,
    paginatedSuppliers,
    totalFilteredCount,
    totalPages,
    metrics,
    selectedSupplierId,
    selectedSupplier,
    supplierToEdit,
    supplierToDelete,
    isCreateModalOpen,
    setSelectedSupplierId,
    setSupplierToEdit,
    setSupplierToDelete,
    setIsCreateModalOpen,
    setSearchQuery,
    setStatus,
    setTier,
    setCategory,
    setSorting,
    setPage,
    resetFilters,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers();

  const statusCounts = React.useMemo(() => {
    return {
      all: suppliers.length,
      active: metrics.activeCount,
      on_hold: metrics.onHoldCount,
      inactive: metrics.inactiveCount,
    };
  }, [suppliers.length, metrics.activeCount, metrics.onHoldCount, metrics.inactiveCount]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      <SuppliersHeader
        totalCount={suppliers.length}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <SuppliersMetrics
        metrics={metrics}
        selectedStatus={filterState.status}
        onSelectStatus={setStatus}
      />

      <SuppliersToolbar
        filterState={filterState}
        hasActiveFilters={hasActiveFilters}
        totalFilteredCount={totalFilteredCount}
        statusCounts={statusCounts}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatus}
        onTierChange={setTier}
        onCategoryChange={setCategory}
        onSortChange={setSorting}
        onResetFilters={resetFilters}
      />

      <SuppliersTable
        suppliers={paginatedSuppliers}
        currentPage={filterState.page}
        totalPages={totalPages}
        totalFilteredCount={totalFilteredCount}
        onPageChange={setPage}
        onSelectSupplier={(id) => setSelectedSupplierId(id)}
        onEditSupplier={(sup) => setSupplierToEdit(sup)}
        onDeleteSupplier={(sup) => setSupplierToDelete(sup)}
      />

      {selectedSupplierId && (
        <SupplierDetailSheet
          supplier={selectedSupplier}
          open={!!selectedSupplierId}
          onClose={() => setSelectedSupplierId(null)}
          onEditSupplier={(sup) => {
            setSupplierToEdit(sup);
          }}
        />
      )}

      <SupplierFormModal
        key={supplierToEdit?.id || "new-sup"}
        supplier={supplierToEdit}
        open={isCreateModalOpen || !!supplierToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSave={(data) => {
          if (supplierToEdit) {
            updateSupplier(supplierToEdit.id, data);
          } else {
            createSupplier(data);
          }
        }}
      />

      <DeleteSupplierDialog
        supplier={supplierToDelete}
        open={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={(id) => deleteSupplier(id)}
      />
    </div>
  );
}
