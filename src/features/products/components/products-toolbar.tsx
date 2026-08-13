"use client";

import * as React from "react";
import { Search, X, RotateCcw, ArrowUpDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      {/* Top Row: Search & Status Pills */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by product name, SKU, category, or barcode..."
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-neo pl-9 pr-8 h-9 text-xs sm:text-sm"
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
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => onStatusChange("all")}
            className={cn(
              "rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              filterState.status === "all"
                ? "bg-foreground text-background border border-black shadow-neo-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All ({metrics.totalProducts})
          </button>
          <button
            type="button"
            onClick={() => onStatusChange("in_stock")}
            className={cn(
              "rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              filterState.status === "in_stock"
                ? "bg-[#dcfce7] text-[#15803d] border border-black shadow-neo-sm font-bold"
                : "bg-muted/60 text-muted-foreground hover:text-[#15803d] hover:bg-[#dcfce7]/40"
            )}
          >
            In Stock ({metrics.inStockCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusChange("low_stock")}
            className={cn(
              "rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              filterState.status === "low_stock"
                ? "bg-[#fef3c7] text-[#b45309] border border-black shadow-neo-sm font-bold"
                : "bg-muted/60 text-muted-foreground hover:text-[#b45309] hover:bg-[#fef3c7]/40"
            )}
          >
            Low Stock ({metrics.lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusChange("out_of_stock")}
            className={cn(
              "rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              filterState.status === "out_of_stock"
                ? "bg-[#fee2e2] text-[#b91c1c] border border-black shadow-neo-sm font-bold"
                : "bg-muted/60 text-muted-foreground hover:text-[#b91c1c] hover:bg-[#fee2e2]/40"
            )}
          >
            Out of Stock ({metrics.outOfStockCount})
          </button>
        </div>
      </div>

      {/* Bottom Row: Multi-Facet Select Dropdowns & Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border/80 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters:</span>
          </div>

          {/* Category Dropdown */}
          <select
            aria-label="Filter by category"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
            value={filterState.category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Warehouse Dropdown */}
          <select
            aria-label="Filter by warehouse"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
            value={filterState.warehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
          >
            <option value="all">All Warehouses</option>
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
              className="h-8 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Sort Field Selector */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            Sort:
          </span>
          <select
            aria-label="Sort products by"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer font-mono"
            value={filterState.sortField}
            onChange={(e) => onSortChange(e.target.value as ProductSortField)}
          >
            <option value="name">Name (A-Z)</option>
            <option value="sku">SKU Code</option>
            <option value="stock">Stock Quantity</option>
            <option value="price">Unit Price</option>
            <option value="category">Category</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSortChange(filterState.sortField)}
            className="h-8 px-2 text-xs font-mono btn-neo"
            title={`Sort ${filterState.sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            {filterState.sortOrder === "asc" ? "ASC ↑" : "DESC ↓"}
          </Button>
        </div>
      </div>
    </div>
  );
}
