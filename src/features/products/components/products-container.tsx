"use client";

import * as React from "react";
import { useProducts } from "../hooks/use-products";
import { ProductsHeader } from "./products-header";
import { ProductsMetrics } from "./products-metrics";
import { ProductsToolbar } from "./products-toolbar";
import { ProductsTable } from "./products-table";
import { ProductDetailSheet } from "./product-detail-sheet";
import { EditProductModal } from "./edit-product-modal";
import { DeleteProductDialog } from "./delete-product-dialog";
import { QuickMovementModal } from "./quick-movement-modal";
import { ProductAddModal } from "./product-add-modal";
import type { Product } from "../types";

export function ProductsContainer() {
  const {
    paginatedProducts,
    metrics,
    filterState,
    totalFilteredCount,
    selectedProduct,
    productToEdit,
    productToDelete,
    hasActiveFilters,

    setSelectedProduct,
    setProductToEdit,
    setProductToDelete,
    setSearchQuery,
    setCategory,
    setStatus,
    setWarehouse,
    setSorting,
    setPage,
    resetFilters,

    addProduct,
    updateProduct,
    deleteProduct,
    recordMovement,
  } = useProducts();

  // Quick Movement State
  const [quickMovementState, setQuickMovementState] = React.useState<{
    product: Product | null;
    type: "in" | "out" | null;
    open: boolean;
  }>({
    product: null,
    type: null,
    open: false,
  });

  // Add Product State (when triggered from empty state)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const handleOpenQuickMovement = (product: Product, type: "in" | "out") => {
    setQuickMovementState({
      product,
      type,
      open: true,
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[1600px] mx-auto pb-10">
      {/* 1. Header with Catalog Counters & Add CTA */}
      <ProductsHeader
        totalCount={metrics.totalProducts}
        onProductAdded={addProduct}
      />

      {/* 2. Top Metric Cards (Clickable filter triggers) */}
      <ProductsMetrics
        metrics={metrics}
        selectedStatus={filterState.status}
        onSelectStatus={setStatus}
      />

      {/* 3. Search & Multi-facet Filtering Toolbar */}
      <ProductsToolbar
        filterState={filterState}
        metrics={metrics}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={setSearchQuery}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
        onWarehouseChange={setWarehouse}
        onSortChange={setSorting}
        onResetFilters={resetFilters}
      />

      {/* 4. Products Table */}
      <ProductsTable
        products={paginatedProducts}
        totalCount={totalFilteredCount}
        filterState={filterState}
        hasActiveFilters={hasActiveFilters}
        onPageChange={setPage}
        onResetFilters={resetFilters}
        onViewDetails={setSelectedProduct}
        onEdit={setProductToEdit}
        onDelete={setProductToDelete}
        onQuickMovement={handleOpenQuickMovement}
        onAddProductClick={() => setIsAddModalOpen(true)}
      />

      {/* 5. Slide-Over Detail Sheet */}
      <ProductDetailSheet
        product={selectedProduct}
        open={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onEdit={(prod) => {
          setSelectedProduct(null);
          setProductToEdit(prod);
        }}
        onQuickMovement={(prod, type) => {
          handleOpenQuickMovement(prod, type);
        }}
      />

      {/* 6. Edit Product Modal */}
      <EditProductModal
        product={productToEdit}
        open={productToEdit !== null}
        onOpenChange={(open) => {
          if (!open) setProductToEdit(null);
        }}
        onUpdateProduct={updateProduct}
      />

      {/* 7. Delete Confirmation Dialog */}
      <DeleteProductDialog
        product={productToDelete}
        open={productToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null);
        }}
        onConfirmDelete={deleteProduct}
      />

      {/* 8. Quick Movement Modal */}
      <QuickMovementModal
        product={quickMovementState.product}
        type={quickMovementState.type}
        open={quickMovementState.open}
        onOpenChange={(open) => {
          setQuickMovementState((prev) => ({ ...prev, open }));
        }}
        onRecordMovement={recordMovement}
      />

      {/* 9. Standalone Add Product Modal (Triggerable from empty state) */}
      <ProductAddModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onProductAdded={addProduct}
      />
    </div>
  );
}
