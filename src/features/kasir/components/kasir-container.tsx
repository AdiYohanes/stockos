"use client";

import * as React from "react";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import type { CloseDailyRegisterResult } from "../types";
import type { CloseDailyRegisterServerInput } from "../actions";
import { useKasir } from "../hooks/use-kasir";
import { ProductCatalogGrid } from "./product-catalog-grid";
import { TallySheet } from "./tally-sheet";
import { MobileTallyBar } from "./mobile-tally-bar";
import { ClosingModal } from "./closing-modal";
import { CheckCircle2, Calculator, X } from "lucide-react";

interface KasirContainerProps {
  products: ProductDto[];
  onCloseRegister?: (input: CloseDailyRegisterServerInput) => Promise<CloseDailyRegisterResult>;
}

export function KasirContainer({ products, onCloseRegister }: KasirContainerProps) {
  const {
    products: filteredProducts,
    tally,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    categories,
    totals,
    handleAddProduct,
    handleIncrement,
    handleDecrement,
    handleSetQuantity,
    handleRemove,
    handleReset,
  } = useKasir(products);

  const [closingModalOpen, setClosingModalOpen] = React.useState(false);
  const [closingSuccess, setClosingSuccess] = React.useState<{
    totalUnits: number;
    expectedRevenue: number;
    reference: string;
  } | null>(null);

  const handleSuccessClose = (summary: {
    totalUnits: number;
    expectedRevenue: number;
    reference: string;
  }) => {
    handleReset();
    setClosingSuccess(summary);
  };

  return (
    <div className="flex flex-col gap-5 pb-20 lg:pb-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b-[3px] border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary text-primary-foreground border-[3px] border-border shadow-hard-sm">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-2xl uppercase tracking-tight text-foreground">
                Kasir Harian
              </h1>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-acid text-white border border-border">
                Tally Register
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Catat penjualan langsung tanpa latensi, rekonsiliasi kas dan potong stok sekaligus di
              akhir hari.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {closingSuccess && (
        <div className="p-4 bg-emerald-500/10 border-[3px] border-emerald-500 text-foreground flex items-start justify-between gap-3 shadow-hard-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-heading font-black text-sm uppercase text-foreground">
                Penutupan Kasir Berhasil!
              </h4>
              <p className="text-muted-foreground">
                Stok sebanyak{" "}
                <strong className="text-foreground font-mono font-bold">
                  {closingSuccess.totalUnits} pcs
                </strong>{" "}
                telah dipotong dari inventaris dengan referensi{" "}
                <strong className="text-foreground font-mono font-bold">
                  {closingSuccess.reference}
                </strong>
                . Total penjualan:{" "}
                <strong className="text-foreground font-mono font-bold">
                  Rp{new Intl.NumberFormat("id-ID").format(closingSuccess.expectedRevenue)}
                </strong>
                .
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setClosingSuccess(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Product Catalog Grid */}
        <div className="flex-1 w-full min-w-0">
          <ProductCatalogGrid
            products={filteredProducts}
            tally={tally}
            search={search}
            onSearchChange={setSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            onSelectProduct={handleAddProduct}
          />
        </div>

        {/* Right Column: Desktop Tally Sheet (Sticky) */}
        <div className="hidden lg:block w-[360px] xl:w-[400px] shrink-0 sticky top-6">
          <TallySheet
            tally={tally}
            totals={totals}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onSetQuantity={handleSetQuantity}
            onRemove={handleRemove}
            onReset={handleReset}
            onOpenClosing={() => setClosingModalOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Floating Bar & Bottom Sheet */}
      <MobileTallyBar
        tally={tally}
        totals={totals}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onSetQuantity={handleSetQuantity}
        onRemove={handleRemove}
        onReset={handleReset}
        onOpenClosing={() => setClosingModalOpen(true)}
      />

      {/* Closing Reconciliation Modal */}
      <ClosingModal
        open={closingModalOpen}
        onOpenChange={setClosingModalOpen}
        tally={tally}
        totals={totals}
        onSuccess={handleSuccessClose}
        onCloseRegister={onCloseRegister}
      />
    </div>
  );
}
