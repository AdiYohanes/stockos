"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useProducts } from "../hooks/use-products";
import { ProductsHeader } from "./products-header";
import { ProductsMetrics } from "./products-metrics";
import { ProductsToolbar } from "./products-toolbar";
import { ProductsTable } from "./products-table";
import { EditProductModal } from "./edit-product-modal";
import { DeleteProductDialog } from "./delete-product-dialog";
import { QuickMovementModal } from "./quick-movement-modal";
import { ProductAddModal } from "./product-add-modal";
import type { Product } from "../types";

const ProductDetailSheet = dynamic(
  () => import("./product-detail-sheet").then((m) => m.ProductDetailSheet),
  { ssr: false }
);

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

  const [quickMovementState, setQuickMovementState] = React.useState<{
    product: Product | null;
    type: "in" | "out" | null;
    open: boolean;
  }>({
    product: null,
    type: null,
    open: false,
  });

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
      <ProductsHeader
        totalCount={metrics.totalProducts}
        onProductAdded={addProduct}
      />

      <ProductsMetrics
        metrics={metrics}
        selectedStatus={filterState.status}
        onSelectStatus={setStatus}
      />

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

      {selectedProduct && (
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
      )}

      <EditProductModal
        key={productToEdit?.id || "new-edit"}
        product={productToEdit}
        open={productToEdit !== null}
        onOpenChange={(open) => {
          if (!open) setProductToEdit(null);
        }}
        onUpdateProduct={updateProduct}
      />

      <DeleteProductDialog
        product={productToDelete}
        open={productToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null);
        }}
        onConfirmDelete={deleteProduct}
      />

      <QuickMovementModal
        key={quickMovementState.product?.id || "new-movement"}
        product={quickMovementState.product}
        type={quickMovementState.type}
        open={quickMovementState.open}
        onOpenChange={(open) => {
          setQuickMovementState((prev) => ({ ...prev, open }));
        }}
        onRecordMovement={recordMovement}
      />

      <ProductAddModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onProductAdded={addProduct}
      />
    </div>
  );
}
