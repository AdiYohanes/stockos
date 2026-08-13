"use client";

import * as React from "react";
import { Search, RotateCcw, Filter, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  InventoryFilterState,
  InventorySortField,
  MovementType,
  StockStatus,
} from "../types";

interface InventoryToolbarProps {
  filterState: InventoryFilterState;
  hasActiveFilters: boolean;
  warehouses: string[];
  categories: string[];
  onSearchChange: (query: string) => void;
  onWarehouseChange: (warehouse: string) => void;
  onStatusChange: (status: "all" | StockStatus) => void;
  onMovementTypeChange: (type: "all" | MovementType) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (field: InventorySortField) => void;
  onResetFilters: () => void;
}

export function InventoryToolbar({
  filterState,
  hasActiveFilters,
  warehouses,
  categories,
  onSearchChange,
  onWarehouseChange,
  onStatusChange,
  onMovementTypeChange,
  onCategoryChange,
  onSortChange,
  onResetFilters,
}: InventoryToolbarProps) {
  const isStockTab = filterState.tab === "stock_levels";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3 sm:p-4 shadow-none">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isStockTab
                ? "Search by SKU, item name, category, or location bin..."
                : "Search by reference code, SKU, item, or performed by..."
            }
            className="pl-9 pr-8 h-9 text-xs font-sans rounded-md border-slate-300 focus:border-black focus:ring-1 focus:ring-black"
          />
          {filterState.searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right: Select dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Warehouse Dropdown */}
          <div className="flex items-center">
            <select
              value={filterState.warehouse}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-50 focus:border-black focus:outline-none"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown (Stock tab only) */}
          {isStockTab && (
            <div className="flex items-center">
              <select
                value={filterState.category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-50 focus:border-black focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center">
            <select
              value={filterState.sortField}
              onChange={(e) => onSortChange(e.target.value as InventorySortField)}
              className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-50 focus:border-black focus:outline-none"
            >
              {isStockTab ? (
                <>
                  <option value="name">Sort: Name</option>
                  <option value="sku">Sort: SKU Code</option>
                  <option value="currentStock">Sort: Stock Level</option>
                  <option value="availableStock">Sort: Available Qty</option>
                  <option value="valuation">Sort: Valuation</option>
                  <option value="lastMovementAt">Sort: Last Movement</option>
                </>
              ) : (
                <>
                  <option value="timestamp">Sort: Timestamp</option>
                  <option value="sku">Sort: SKU Code</option>
                  <option value="name">Sort: Item Name</option>
                </>
              )}
            </select>
          </div>

          {/* Sort Order Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSortChange(filterState.sortField)}
            className="h-9 w-9 p-0 border border-slate-300 bg-white hover:bg-slate-50"
            title={`Sort Order: ${filterState.sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-600" />
          </Button>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1 px-2.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Status / Type Pills Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-muted-foreground mr-1">
          <Filter className="h-3 w-3" />
          <span>Status:</span>
        </div>

        {isStockTab ? (
          <>
            {(
              [
                { label: "All Items", value: "all" },
                { label: "In Stock", value: "in_stock" },
                { label: "Low Stock", value: "low_stock" },
                { label: "Out of Stock", value: "out_of_stock" },
                { label: "Overstocked", value: "overstocked" },
              ] as const
            ).map((pill) => {
              const isActive = filterState.status === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => onStatusChange(pill.value)}
                  className={cn(
                    "rounded-sm px-2.5 py-1 text-xs font-mono transition-all border",
                    isActive
                      ? "bg-black text-white border-black font-semibold shadow-neo-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {pill.label}
                </button>
              );
            })}
          </>
        ) : (
          <>
            {(
              [
                { label: "All Types", value: "all" },
                { label: "Stock In", value: "in" },
                { label: "Stock Out", value: "out" },
                { label: "Adjustments", value: "adjustment" },
              ] as const
            ).map((pill) => {
              const isActive = filterState.movementType === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => onMovementTypeChange(pill.value)}
                  className={cn(
                    "rounded-sm px-2.5 py-1 text-xs font-mono transition-all border",
                    isActive
                      ? "bg-black text-white border-black font-semibold shadow-neo-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {pill.label}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
