"use client";

import * as React from "react";
import { useSuppliers } from "../hooks/use-suppliers";
import { SuppliersHeader } from "./suppliers-header";
import { SuppliersMetrics } from "./suppliers-metrics";
import { SuppliersToolbar } from "./suppliers-toolbar";
import { SuppliersTable } from "./suppliers-table";
import { SupplierDetailSheet } from "./supplier-detail-sheet";
import { SupplierFormModal } from "./supplier-form-modal";
import { DeleteSupplierDialog } from "./delete-supplier-dialog";

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
      {/* 1. Header & Actions */}
      <SuppliersHeader
        totalCount={suppliers.length}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* 2. Interactive Metric Cards */}
      <SuppliersMetrics
        metrics={metrics}
        selectedStatus={filterState.status}
        onSelectStatus={setStatus}
      />

      {/* 3. Unified Toolbar */}
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

      {/* 4. High-Density Table */}
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

      {/* 5. Slide-Over Detail Sheet */}
      <SupplierDetailSheet
        supplier={selectedSupplier}
        open={!!selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
        onEditSupplier={(sup) => {
          setSupplierToEdit(sup);
        }}
      />

      {/* 6. Add / Edit Supplier Form Modal */}
      <SupplierFormModal
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

      {/* 7. Delete Confirmation Dialog */}
      <DeleteSupplierDialog
        supplier={supplierToDelete}
        open={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={(id) => deleteSupplier(id)}
      />
    </div>
  );
}
