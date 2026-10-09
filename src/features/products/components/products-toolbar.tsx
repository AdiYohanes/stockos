"use client";

import * as React from "react";
import { Search, X, RotateCcw, ArrowUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { PRODUCT_CATEGORIES } from "../mock-data";
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
  onSortChange,
  onResetFilters,
}: ProductsToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4 p-4 border-b-[3px] border-ink bg-white dark:bg-black">
      {/* Top Row: Search & Status Pills */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md flex items-center bg-white border-[3px] border-ink shadow-hard-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" />
          <input
            type="text"
            placeholder={t.products.searchPlaceholder}
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-focus w-full pl-9 pr-8 h-10 bg-transparent font-sans text-sm text-ink placeholder:text-ink/50"
          />
          {filterState.searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-none p-0.5 text-ink hover:text-acid cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-paper border-[3px] border-ink shadow-hard-sm shrink-0 w-fit max-w-full overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => onStatusChange("all")}
            className={cn(
              "inline-flex items-center px-4 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer whitespace-nowrap",
              filterState.status === "all"
                ? "bg-ink text-paper"
                : "text-ink hover:bg-ink/10"
            )}
          >
            <span>{t.common.all}</span>
            <span className="ml-1.5 font-mono tabular-nums text-[10px] opacity-75">
              ({metrics.totalProducts})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("in_stock")}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer whitespace-nowrap",
              filterState.status === "in_stock"
                ? "bg-ink text-paper"
                : "text-ink hover:bg-ink/10"
            )}
          >
            <span className={cn("w-2 h-2 shrink-0", filterState.status === "in_stock" ? "bg-acid" : "bg-emerald-600")} />
            <span>{t.products.inStock}</span>
            <span className="font-mono tabular-nums text-[10px] opacity-75">
              ({metrics.inStockCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("low_stock")}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer whitespace-nowrap",
              filterState.status === "low_stock"
                ? "bg-ink text-paper"
                : "text-ink hover:bg-ink/10"
            )}
          >
            <span className={cn("w-2 h-2 shrink-0", filterState.status === "low_stock" ? "bg-acid" : "bg-orange-500")} />
            <span>{t.products.lowStock}</span>
            <span className="font-mono tabular-nums text-[10px] opacity-75">
              ({metrics.lowStockCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("out_of_stock")}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer whitespace-nowrap",
              filterState.status === "out_of_stock"
                ? "bg-ink text-paper"
                : "text-ink hover:bg-ink/10"
            )}
          >
            <span className={cn("w-2 h-2 shrink-0", filterState.status === "out_of_stock" ? "bg-acid" : "bg-red-600")} />
            <span>{t.products.outOfStock}</span>
            <span className="font-mono tabular-nums text-[10px] opacity-75">
              ({metrics.outOfStockCount})
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Multi-Facet Select Dropdowns & Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-ink pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-ink font-bold uppercase">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t.common.filter}:</span>
          </div>

          {/* Category Dropdown */}
          <select
            aria-label="Filter by category"
            className="h-9 rounded-none border-[3px] border-ink shadow-hard-sm bg-white px-3 py-1 text-xs font-bold uppercase text-ink transition-colors outline-none hover:bg-paper focus:bg-paper cursor-pointer"
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

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="press h-9 px-3 flex items-center gap-1.5 text-xs font-bold uppercase bg-red-600 text-white border-[3px] border-ink shadow-hard-sm cursor-pointer hover:bg-red-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.products.empty.resetAllFilters}
            </button>
          )}
        </div>

        {/* Sort Field Selector */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-ink font-bold uppercase flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4" />
            {t.products.sort}:
          </span>
          <select
            aria-label="Sort products by"
            className="h-9 rounded-none border-[3px] border-ink shadow-hard-sm bg-white px-3 py-1 text-xs font-bold uppercase text-ink transition-colors outline-none hover:bg-paper focus:bg-paper cursor-pointer"
            value={filterState.sortField}
            onChange={(e) => onSortChange(e.target.value as ProductSortField)}
          >
            <option value="name">{t.products.sortName}</option>
            <option value="sku">{t.products.sortSku}</option>
            <option value="stock">{t.products.sortStock}</option>
            <option value="price">{t.products.sortPrice}</option>
            <option value="category">{t.products.sortCategory}</option>
          </select>
          <button
            type="button"
            onClick={() => onSortChange(filterState.sortField)}
            className="press h-9 px-3 bg-white border-[3px] border-ink shadow-hard-sm text-xs font-mono tabular-nums font-bold text-ink hover:bg-paper"
            title={`Sort ${filterState.sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            {filterState.sortOrder === "asc" ? "ASC ↑" : "DESC ↓"}
          </button>
        </div>
      </div>
    </div>
  );
}
