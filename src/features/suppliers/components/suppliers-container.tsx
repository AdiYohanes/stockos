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
    setPage,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers();

  return (
    <div className="flex flex-col gap-0 pb-12">
      <SuppliersHeader
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <SuppliersMetrics
        metrics={metrics}
      />

      <section className="bg-white border-[3px] border-ink shadow-hard-lg overflow-hidden">
        <SuppliersToolbar
          totalCount={suppliers.length}
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
      </section>

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
        key={supplierToDelete?.id ?? "closed"}
        supplier={supplierToDelete}
        open={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={(id) => deleteSupplier(id)}
      />
    </div>
  );
}
