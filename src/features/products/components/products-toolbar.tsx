"use client";

import * as React from "react";
import { Search, X, RotateCcw, ArrowUpDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { PRODUCT_CATEGORIES, WAREHOUSES } from "../mock-data";
import type {
  ProductFilterState,
  ProductMetrics,
  ProductSortField,
  ProductStatus,
} from "../types";

interface ProductsToolbarProps {
  filterState: ProductFilterState;
  metrics: ProductMetrics;
  hasActiveFilters: boolean;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: "all" | ProductStatus) => void;
  onWarehouseChange: (warehouse: string) => void;
  onSortChange: (field: ProductSortField) => void;
  onResetFilters: () => void;
}

export function ProductsToolbar({
  filterState,
  metrics,
  hasActiveFilters,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onWarehouseChange,
  onSortChange,
  onResetFilters,
}: ProductsToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 border-b border-border bg-card">
      {/* Top Row: Search & Status Pills */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t.products.searchPlaceholder}
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs sm:text-sm"
          />
          {filterState.searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => onStatusChange("all")}
            className={cn(
              "inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border",
              filterState.status === "all"
                ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-50 text-slate-600 border-border hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <span>{t.common.all}</span>
            <span className="ml-1.5 font-mono tabular-nums text-[11px] opacity-75">
              ({metrics.totalProducts})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("in_stock")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border",
              filterState.status === "in_stock"
                ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-50 text-slate-600 border-border hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            <span>{t.products.inStock}</span>
            <span className="font-mono tabular-nums text-[11px] opacity-75">
              ({metrics.inStockCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("low_stock")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border",
              filterState.status === "low_stock"
                ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-50 text-slate-600 border-border hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
            <span>{t.products.lowStock}</span>
            <span className="font-mono tabular-nums text-[11px] opacity-75">
              ({metrics.lowStockCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("out_of_stock")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border",
              filterState.status === "out_of_stock"
                ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-50 text-slate-600 border-border hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
            <span>{t.products.outOfStock}</span>
            <span className="font-mono tabular-nums text-[11px] opacity-75">
              ({metrics.outOfStockCount})
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Multi-Facet Select Dropdowns & Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border/70 pt-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.common.filter}:</span>
          </div>

          {/* Category Dropdown */}
          <select
            aria-label="Filter by category"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer"
            value={filterState.category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">{t.products.allCategories}</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Warehouse Dropdown */}
          <select
            aria-label="Filter by warehouse"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer"
            value={filterState.warehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
          >
            <option value="all">{t.products.allWarehouses}</option>
            {WAREHOUSES.map((wh) => (
              <option key={wh} value={wh}>
                {wh}
              </option>
            ))}
          </select>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8 px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 cursor-pointer gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              {t.products.empty.resetAllFilters}
            </Button>
          )}
        </div>

        {/* Sort Field Selector */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            {t.products.sort}:
          </span>
          <select
            aria-label="Sort products by"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs font-sans text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer"
            value={filterState.sortField}
            onChange={(e) => onSortChange(e.target.value as ProductSortField)}
          >
            <option value="name">{t.products.sortName}</option>
            <option value="sku">{t.products.sortSku}</option>
            <option value="stock">{t.products.sortStock}</option>
            <option value="price">{t.products.sortPrice}</option>
            <option value="category">{t.products.sortCategory}</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSortChange(filterState.sortField)}
            className="h-8 px-2.5 text-xs font-mono tabular-nums text-muted-foreground hover:text-foreground hover:border-slate-400"
            title={`Sort ${filterState.sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            {filterState.sortOrder === "asc" ? "ASC ↑" : "DESC ↓"}
          </Button>
        </div>
      </div>
    </div>
  );
}
