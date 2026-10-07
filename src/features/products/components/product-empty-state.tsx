"use client";

import * as React from "react";
import { PackageSearch, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center">
      {/* Icon Badge: Calm hairline surface */}
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-slate-100 dark:bg-slate-800 mb-3 text-muted-foreground">
        <PackageSearch className="h-5 w-5" />
      </div>

      {/* Heading & description */}
      <h3 className="text-sm sm:text-base font-semibold font-sans text-foreground">
        {hasFilters ? t.products.empty.noMatching : t.products.empty.noProducts}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
        {hasFilters ? t.products.empty.noMatchingDesc : t.products.empty.noProductsDesc}
      </p>

      {/* Action CTA */}
      <div className="mt-4 flex items-center gap-2">
        {hasFilters && onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="h-8 px-3 text-xs gap-1.5 hover:border-slate-400"
          >
            <RotateCcw className="h-3 w-3" />
            {t.products.empty.resetAllFilters}
          </Button>
        )}
        {onAddProduct && (
          <Button
            type="button"
            size="sm"
            onClick={onAddProduct}
            className="h-8 px-3 text-xs gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.products.addProduct}
          </Button>
        )}
      </div>
    </div>
  );
}
