"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  PackageSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkuBadge } from "@/components/shared/sku-badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { InventoryFilterState, InventoryItem } from "../types";

interface InventoryStockTableProps {
  items: InventoryItem[];
  totalCount: number;
  filterState: InventoryFilterState;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onSelectItem: (item: InventoryItem) => void;
  onAdjustItem: (item: InventoryItem) => void;
  onQuickMove: (item: InventoryItem, type: "in" | "out") => void;
}

export function InventoryStockTable({
  items,
  totalCount,
  filterState,
  hasActiveFilters,
  onPageChange,
  onResetFilters,
  onSelectItem,
  onAdjustItem,
  onQuickMove,
}: InventoryStockTableProps) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(totalCount / filterState.pageSize));
  const startIndex = (filterState.page - 1) * filterState.pageSize + 1;
  const endIndex = Math.min(filterState.page * filterState.pageSize, totalCount);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (item: InventoryItem) => {
    switch (item.status) {
      case "in_stock":
        return (
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
            <span>{t.inventory.inStock}</span>
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-amber-700 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0 animate-pulse" />
            <span>{t.inventory.lowStock}</span>
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-rose-700 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
            <span>{t.inventory.outOfStock}</span>
          </span>
        );
      case "overstocked":
        return (
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-blue-700 dark:text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
            <span>{t.inventory.overstocked}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-slate-50/60 dark:bg-slate-900/40 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 px-3.5 sm:px-4">{t.inventory.colSku}</th>
              <th className="py-2.5 px-3.5 sm:px-4 min-w-[200px]">{t.inventory.colProductLocation}</th>
              <th className="py-2.5 px-3.5 sm:px-4">{t.inventory.colWarehouse}</th>
              <th className="py-2.5 px-3.5 sm:px-4 min-w-[160px]">{t.inventory.colStockHealth}</th>
              <th className="py-2.5 px-3.5 sm:px-4 text-right">{t.inventory.colOnHand}</th>
              <th className="py-2.5 px-3.5 sm:px-4 text-right">{t.inventory.colAvailable}</th>
              <th className="py-2.5 px-3.5 sm:px-4 text-right">{t.inventory.colValuation}</th>
              <th className="py-2.5 px-3.5 sm:px-4 text-center">{t.inventory.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-slate-50 text-slate-500 dark:bg-slate-900">
                      <PackageSearch className="h-5 w-5" />
                    </div>
                    <p className="font-sans font-semibold text-foreground text-sm">
                      {t.inventory.noMatchingItems}
                    </p>
                    <p className="font-sans text-xs text-muted-foreground max-w-sm">
                      {t.inventory.noMatchingItemsDesc}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetFilters}
                        className="mt-2 text-xs border-border hover:border-slate-400"
                      >
                        {t.inventory.clearAllFilters}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const stockRatio = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));
                const totalValue = item.currentStock * item.unitCost;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectItem(item)}
                  >
                    {/* 1. SKU */}
                    <td className="py-2.5 px-3.5 sm:px-4">
                      <SkuBadge code={item.sku} />
                    </td>

                    {/* 2. Name & Bin Tag */}
                    <td className="py-2.5 px-3.5 sm:px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-sans font-medium text-foreground group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors truncate">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] text-muted-foreground">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                            {item.locationBin}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Warehouse */}
                    <td className="py-2.5 px-3.5 sm:px-4 font-sans text-xs text-muted-foreground">
                      {item.warehouse}
                    </td>

                    {/* 4. Stock Health Gauge */}
                    <td className="py-2.5 px-3.5 sm:px-4">
                      <div className="flex flex-col gap-1.5 max-w-[140px]">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(item)}
                          <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                            {t.inventory.min}: {item.minStock}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              item.status === "out_of_stock" && "bg-rose-600",
                              item.status === "low_stock" && "bg-amber-600",
                              item.status === "in_stock" && "bg-emerald-600",
                              item.status === "overstocked" && "bg-blue-600"
                            )}
                            style={{ width: `${Math.max(4, stockRatio)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 5. On Hand */}
                    <td className="py-2.5 px-3.5 sm:px-4 text-right font-mono tabular-nums">
                      <div className="font-medium text-foreground">
                        {item.currentStock.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-sans">{item.unit}</div>
                    </td>

                    {/* 6. Available */}
                    <td className="py-2.5 px-3.5 sm:px-4 text-right font-mono tabular-nums">
                      <div className={cn("font-medium", item.availableStock === 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                        {item.availableStock.toLocaleString("id-ID")}
                      </div>
                      {item.reservedStock > 0 && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-sans">
                          ({item.reservedStock} {t.inventory.reserved})
                        </div>
                      )}
                    </td>

                    {/* 7. Valuation */}
                    <td className="py-2.5 px-3.5 sm:px-4 text-right font-mono tabular-nums">
                      <div className="font-medium text-foreground">
                        {formatCurrency(totalValue)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        @{formatCurrency(item.unitCost)}
                      </div>
                    </td>

                    {/* 8. Contextual Actions */}
                    <td
                      className="py-2.5 px-3.5 sm:px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {/* Quick Stock In */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickMove(item, "in")}
                          title={t.inventory.stockInType}
                          className="h-7 w-7 p-0 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>

                        {/* Quick Stock Out */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickMove(item, "out")}
                          disabled={item.currentStock === 0}
                          title={t.inventory.stockOutType}
                          className="h-7 w-7 p-0 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>

                        {/* Adjust Stock */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onAdjustItem(item)}
                          title={t.inventory.adjustStock}
                          className="h-7 w-7 p-0 text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </Button>

                        {/* Inspect Details */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectItem(item)}
                          title={t.common.details}
                          className="h-7 w-7 p-0 text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border px-4 py-2.5 bg-slate-50/40 dark:bg-slate-900/20">
          <div className="font-mono tabular-nums text-xs text-muted-foreground">
            {t.inventory.showing} <span className="font-medium text-foreground">{startIndex}</span> {t.inventory.to}{" "}
            <span className="font-medium text-foreground">{endIndex}</span> {t.inventory.of}{" "}
            <span className="font-medium text-foreground">{totalCount}</span> {t.common.items}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(filterState.page - 1)}
              disabled={filterState.page <= 1}
              className="h-8 gap-1 px-2.5 text-xs border-border font-sans disabled:opacity-40 hover:border-slate-400"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{t.inventory.prev}</span>
            </Button>

            <span className="font-mono tabular-nums text-xs text-muted-foreground px-1">
              {t.inventory.page} <span className="font-medium text-foreground">{filterState.page}</span> {t.inventory.of} {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(filterState.page + 1)}
              disabled={filterState.page >= totalPages}
              className="h-8 gap-1 px-2.5 text-xs border-border font-sans disabled:opacity-40 hover:border-slate-400"
            >
              <span>{t.inventory.next}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
