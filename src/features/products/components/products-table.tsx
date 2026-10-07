"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkuBadge } from "@/components/shared/sku-badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { ProductRowActions } from "./product-row-actions";
import { ProductEmptyState } from "./product-empty-state";
import type { Product, ProductFilterState } from "../types";

interface ProductsTableProps {
  products: Product[];
  totalCount: number;
  filterState: ProductFilterState;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onViewDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onQuickMovement: (product: Product, type: "in" | "out") => void;
  onAddProductClick: () => void;
}

export function ProductsTable({
  products,
  totalCount,
  filterState,
  hasActiveFilters,
  onPageChange,
  onResetFilters,
  onViewDetails,
  onEdit,
  onDelete,
  onQuickMovement,
  onAddProductClick,
}: ProductsTableProps) {
  const { t } = useI18n();
  const { page, pageSize } = filterState;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  if (products.length === 0) {
    return (
      <ProductEmptyState
        hasFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        onAddProduct={onAddProductClick}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[850px]">
          <thead className="border-b border-border bg-slate-50/80 dark:bg-slate-900/60 font-sans text-xs font-medium text-muted-foreground uppercase tracking-wider select-none">
            <tr>
              <th scope="col" className="px-3.5 py-2.5 min-w-[220px]">
                {t.products.table.colProduct}
              </th>
              <th scope="col" className="px-3.5 py-2.5 w-[140px]">
                {t.products.table.colSku}
              </th>
              <th scope="col" className="px-3.5 py-2.5 w-[160px]">
                {t.products.table.colStock}
              </th>
              <th scope="col" className="px-3.5 py-2.5 w-[150px] text-right">
                {t.products.table.colPrice}
              </th>
              <th scope="col" className="px-3.5 py-2.5 w-[150px]">
                {t.products.table.colLocation}
              </th>
              <th scope="col" className="px-3.5 py-2.5 w-[130px]">
                {t.common.status}
              </th>
              <th scope="col" className="px-3.5 py-2.5 w-[60px] text-right">
                <span className="sr-only">{t.common.actions}</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const stockPercentage =
                product.minStock > 0
                  ? Math.min(100, Math.round((product.currentStock / product.minStock) * 100))
                  : 100;
              const totalProductValue = product.currentStock * (product.unitPrice || 0);

              return (
                <tr
                  key={product.id}
                  onClick={() => onViewDetails(product)}
                  className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer h-12"
                >
                  {/* Col 1: Product Name & Category */}
                  <td className="px-3.5 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-sans font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-sans">
                          {product.category}
                        </span>
                        {product.supplier && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                              {product.supplier}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Col 2: SKU & Barcode */}
                  <td className="px-3.5 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <SkuBadge code={product.sku} />
                      {product.barcode && (
                        <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                          #{product.barcode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Col 3: Stock Level & Progress Bar */}
                  <td className="px-3.5 py-2.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                        <span
                          className={cn(
                            "font-medium",
                            product.status === "out_of_stock"
                              ? "text-rose-600 font-semibold"
                              : product.status === "low_stock"
                              ? "text-amber-600 font-semibold"
                              : "text-foreground"
                          )}
                        >
                          {formatNumber(product.currentStock)}{" "}
                          <span className="text-[11px] text-muted-foreground font-sans">
                            {product.unit}
                          </span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          min {product.minStock}
                        </span>
                      </div>

                      {/* Subtle 3px Stock Gauge */}
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          style={{ width: `${Math.max(product.currentStock > 0 ? 6 : 0, stockPercentage)}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            product.status === "out_of_stock"
                              ? "bg-rose-600"
                              : product.status === "low_stock"
                              ? "bg-amber-600"
                              : "bg-emerald-600"
                          )}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Col 4: Price & Valuation (Right-Aligned Numbers) */}
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(product.unitPrice || 0)}
                        <span className="text-[10px] text-muted-foreground font-sans">
                          /{product.unit}
                        </span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatCurrency(totalProductValue)}
                      </span>
                    </div>
                  </td>

                  {/* Col 5: Warehouse Location */}
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <Warehouse className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate text-xs text-muted-foreground font-sans">{product.warehouse}</span>
                    </div>
                  </td>

                  {/* Col 6: Disciplined Status Micro-Dot */}
                  <td className="px-3.5 py-2.5">
                    {product.status === "in_stock" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>{t.products.inStock}</span>
                      </span>
                    )}
                    {product.status === "low_stock" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                        <span>{t.products.lowStock}</span>
                      </span>
                    )}
                    {product.status === "out_of_stock" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                        <span>{t.products.outOfStock}</span>
                      </span>
                    )}
                    {product.status === "draft" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span>Draft</span>
                      </span>
                    )}
                  </td>

                  {/* Col 7: Actions Menu */}
                  <td className="px-3.5 py-2.5 text-right">
                    <ProductRowActions
                      product={product}
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onQuickMovement={onQuickMovement}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="text-xs text-muted-foreground font-mono tabular-nums">
          {t.products.table.showing} <span className="font-medium text-foreground">{startItem}</span>–<span className="font-medium text-foreground">{endItem}</span> {t.products.table.of}{" "}
          <span className="font-medium text-foreground">{totalCount}</span> {t.products.table.products}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 px-2.5 text-xs gap-1 font-mono tabular-nums hover:border-slate-400"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t.products.table.previous}
          </Button>

          <span className="text-xs font-mono tabular-nums text-muted-foreground px-1.5">
            {page} / {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-8 px-2.5 text-xs gap-1 font-mono tabular-nums hover:border-slate-400"
          >
            {t.products.table.next}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
