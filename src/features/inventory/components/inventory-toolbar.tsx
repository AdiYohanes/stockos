"use client";

import * as React from "react";
import { Search, RotateCcw, Filter, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
  const isStockTab = filterState.tab === "stock_levels";

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-card border-b border-border">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isStockTab
                ? t.inventory.searchStockPlaceholder
                : t.inventory.searchMovementPlaceholder
            }
            className="pl-9 pr-8 h-9 text-xs font-sans rounded-md border-border bg-background focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
          {filterState.searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
              className="h-9 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground shadow-none hover:border-slate-400 focus:border-slate-900 focus:outline-none dark:hover:border-slate-600"
            >
              <option value="all">{t.inventory.allWarehouses}</option>
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
                className="h-9 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground shadow-none hover:border-slate-400 focus:border-slate-900 focus:outline-none dark:hover:border-slate-600"
              >
                <option value="all">{t.inventory.allCategories}</option>
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
              className="h-9 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground shadow-none hover:border-slate-400 focus:border-slate-900 focus:outline-none dark:hover:border-slate-600"
            >
              {isStockTab ? (
                <>
                  <option value="name">{t.inventory.sortName}</option>
                  <option value="sku">{t.inventory.sortSku}</option>
                  <option value="currentStock">{t.inventory.sortStockLevel}</option>
                  <option value="availableStock">{t.inventory.sortAvailableQty}</option>
                  <option value="valuation">{t.inventory.sortValuation}</option>
                  <option value="lastMovementAt">{t.inventory.sortLastMovement}</option>
                </>
              ) : (
                <>
                  <option value="timestamp">{t.inventory.sortTimestamp}</option>
                  <option value="sku">{t.inventory.sortSku}</option>
                  <option value="name">{t.inventory.sortItemName}</option>
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
            className="h-9 w-9 p-0 border border-border bg-background hover:bg-slate-50 dark:hover:bg-slate-800"
            title={`Sort Order: ${filterState.sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 gap-1 px-2.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t.common.reset}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Status / Type Pills Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
        <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-muted-foreground mr-1">
          <Filter className="h-3 w-3" />
          <span>{t.inventory.statusLabel}</span>
        </div>

        {isStockTab ? (
          <>
            {(
              [
                { label: t.inventory.allItems, value: "all" },
                { label: t.inventory.inStock, value: "in_stock" },
                { label: t.inventory.lowStock, value: "low_stock" },
                { label: t.inventory.outOfStock, value: "out_of_stock" },
                { label: t.inventory.overstocked, value: "overstocked" },
              ] as const
            ).map((pill) => {
              const isActive = filterState.status === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => onStatusChange(pill.value)}
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-xs font-sans transition-colors border cursor-pointer",
                    isActive
                      ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900 font-medium"
                      : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
                { label: t.inventory.allTypes, value: "all" },
                { label: t.inventory.stockInType, value: "in" },
                { label: t.inventory.stockOutType, value: "out" },
                { label: t.inventory.adjustmentsType, value: "adjustment" },
              ] as const
            ).map((pill) => {
              const isActive = filterState.movementType === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => onMovementTypeChange(pill.value)}
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-xs font-sans transition-colors border cursor-pointer",
                    isActive
                      ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900 font-medium"
                      : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
