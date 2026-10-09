"use client";

import * as React from "react";
import { PackageSearch, Plus, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface ProductEmptyStateProps {
  hasFilters: boolean;
  onResetFilters?: () => void;
  onAddProduct?: () => void;
}

export function ProductEmptyState({
  hasFilters,
  onResetFilters,
  onAddProduct,
}: ProductEmptyStateProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-paper border-[3px] border-ink shadow-hard-sm">
      <div className="flex h-12 w-12 items-center justify-center border-[3px] border-ink bg-white mb-4 shadow-hard-sm text-ink">
        <PackageSearch className="h-6 w-6" />
      </div>

      <h3 className="font-display font-[900] uppercase tracking-tighter text-xl text-ink">
        {hasFilters ? t.products.empty.noMatching : t.products.empty.noProducts}
      </h3>
      <p className="mt-2 max-w-sm text-xs font-mono uppercase tracking-widest text-ink/70">
        {hasFilters ? t.products.empty.noMatchingDesc : t.products.empty.noProductsDesc}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        {hasFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="press btn-neo h-10 px-4 text-xs font-bold uppercase flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t.products.empty.resetAllFilters}
          </button>
        )}
        {onAddProduct && (
          <button
            type="button"
            onClick={onAddProduct}
            className="press btn-neo-primary h-10 px-4 text-xs font-bold uppercase flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t.products.addProduct}
          </button>
        )}
      </div>
    </div>
  );
}
