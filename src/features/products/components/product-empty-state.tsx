"use client";

import * as React from "react";
import { PackageSearch, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-slate-50/50 p-8 sm:p-12 text-center">
      {/* Icon Badge */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black bg-white shadow-neo mb-4">
        <PackageSearch className="h-7 w-7 text-muted-foreground" />
      </div>

      {/* Heading & description */}
      <h3 className="text-base sm:text-lg font-bold font-heading text-foreground">
        {hasFilters ? "No matching products found" : "No products in catalog"}
      </h3>
      <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground">
        {hasFilters
          ? "We couldn't find any products matching your current search query or filter parameters."
          : "Start building your inventory catalog by registering your first product item."}
      </p>

      {/* Action CTA */}
      <div className="mt-5 flex items-center gap-3">
        {hasFilters && onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="btn-neo gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </Button>
        )}
        {onAddProduct && (
          <Button
            type="button"
            size="sm"
            onClick={onAddProduct}
            className="btn-neo-primary gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        )}
      </div>
    </div>
  );
}
