"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
      <div className="relative w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead className="bg-paper border-b-[3px] border-ink font-mono text-[10px] uppercase tracking-widest text-ink select-none">
            <tr>
              <th scope="col" className="px-5 py-4 min-w-[220px]">
                {t.products.table.colProduct}
              </th>
              <th scope="col" className="px-5 py-4 w-[140px]">
                {t.products.table.colSku}
              </th>
              <th scope="col" className="px-5 py-4 w-[160px]">
                {t.products.table.colStock}
              </th>
              <th scope="col" className="px-5 py-4 w-[150px] text-right">
                {t.products.table.colPrice}
              </th>
              <th scope="col" className="px-5 py-4 w-[130px]">
                {t.common.status}
              </th>
              <th scope="col" className="px-5 py-4 w-[60px] text-right">
                <span className="sr-only">{t.common.actions}</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y-[2px] divide-black/10 dark:divide-white/10">
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
                  className="group transition-colors hover:bg-acid/10 cursor-pointer h-16"
                >
                  {/* Col 1: Product Name & Category */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-display font-bold uppercase text-sm text-ink group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-[9px] opacity-45 uppercase">
                          {product.category}
                        </span>
                        {product.supplier && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="font-mono text-[9px] opacity-45 uppercase truncate max-w-[150px]">
                              {product.supplier}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Col 2: SKU & Barcode */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <SkuBadge code={product.sku} />
                      {product.barcode && (
                        <span className="font-mono tabular-nums text-[10px] text-ink opacity-45">
                          #{product.barcode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Col 3: Stock Level & Progress Bar */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between font-mono tabular-nums">
                        <span
                          className={cn(
                            "font-display font-[900] text-sm",
                            product.status === "out_of_stock"
                              ? "text-red-600"
                              : product.status === "low_stock"
                              ? "text-orange-700"
                              : "text-ink"
                          )}
                        >
                          {formatNumber(product.currentStock)}{" "}
                          <span className="text-[10px] opacity-45 font-mono uppercase">
                            {product.unit}
                          </span>
                        </span>
                        <span className="text-[10px] opacity-45 uppercase">
                          min {product.minStock}
                        </span>
                      </div>

                      {/* 3px Stock Gauge - Neobrutalist */}
                      <div className="h-1.5 w-full overflow-hidden bg-paper border border-ink">
                        <div
                          style={{ width: `${Math.max(product.currentStock > 0 ? 6 : 0, stockPercentage)}%` }}
                          className={cn(
                            "h-full transition-all duration-300 border-r border-ink",
                            product.status === "out_of_stock"
                              ? "bg-red-600"
                              : product.status === "low_stock"
                              ? "bg-orange-400"
                              : "bg-acid"
                          )}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Col 4: Price & Valuation (Right-Aligned Numbers) */}
                  <td className="px-5 py-4 text-right font-mono tabular-nums">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-ink">
                        <span className="text-[10px] text-ink/50 mr-1">J:</span>
                        {formatCurrency(product.unitPrice || 0)}
                      </span>
                      {product.unitPurchasePrice !== undefined && (
                        <span className="text-xs font-bold text-emerald-600 mt-1">
                          <span className="text-[10px] text-emerald-600/50 mr-1">B:</span>
                          {formatCurrency(product.unitPurchasePrice)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Col 6: Disciplined Status Micro-Dot */}
                  <td className="px-5 py-4">
                    {product.status === "in_stock" && (
                      <span className="bg-acid border-[3px] border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink">
                        Optimal
                      </span>
                    )}
                    {product.status === "low_stock" && (
                      <span className="bg-orange-400 border-[3px] border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink">
                        Low Stock
                      </span>
                    )}
                    {product.status === "out_of_stock" && (
                      <span className="bg-ink text-paper border-[3px] border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
                        Critical
                      </span>
                    )}
                    {product.status === "draft" && (
                      <span className="bg-paper border-[3px] border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink">
                        Draft
                      </span>
                    )}
                  </td>

                  {/* Col 7: Actions Menu */}
                  <td className="px-5 py-4 text-right">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t-[3px] border-ink px-5 py-4 bg-paper">
        <div className="text-[10px] text-ink opacity-60 font-mono tabular-nums uppercase tracking-widest">
          {t.products.table.showing} <span className="font-bold opacity-100">{startItem}</span>–<span className="font-bold opacity-100">{endItem}</span> {t.products.table.of}{" "}
          <span className="font-bold opacity-100">{totalCount}</span> {t.products.table.products}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-ink">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="press px-3 py-2 bg-white border-[3px] border-ink shadow-hard-sm font-mono text-[10px] uppercase font-bold disabled:opacity-50 flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t.products.table.previous}
          </button>

          <span className="text-[10px] font-mono tabular-nums font-bold px-2">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="press px-3 py-2 bg-white border-[3px] border-ink shadow-hard-sm font-mono text-[10px] uppercase font-bold disabled:opacity-50 flex items-center gap-1"
          >
            {t.products.table.next}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
