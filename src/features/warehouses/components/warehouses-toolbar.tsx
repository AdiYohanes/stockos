"use client";

import * as React from "react";
import {
  Search,
  X,
  RotateCcw,
  ArrowUpDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  WarehouseFilterState,
  WarehouseSortField,
  WarehouseStatus,
  WarehouseType,
  WarehouseViewMode,
} from "../types";
import { WAREHOUSE_TYPES } from "../mock-data";

interface WarehousesToolbarProps {
  filterState: WarehouseFilterState;
  hasActiveFilters: boolean;
  totalFilteredCount: number;
  statusCounts: {
    all: number;
    active: number;
    maintenance: number;
    full: number;
  };
  onSearchChange: (query: string) => void;
  onStatusChange: (status: "all" | WarehouseStatus) => void;
  onTypeChange: (type: "all" | WarehouseType) => void;
  onViewModeChange: (viewMode: WarehouseViewMode) => void;
  onSortChange: (field: WarehouseSortField) => void;
  onResetFilters: () => void;
}

const SORT_OPTIONS: { label: string; value: WarehouseSortField }[] = [
  { label: "Facility Name", value: "name" },
  { label: "Hub Code", value: "code" },
  { label: "Capacity Utilization", value: "utilization" },
  { label: "Max Capacity", value: "capacity" },
  { label: "Asset Valuation", value: "valuation" },
  { label: "Stored SKUs", value: "skus" },
  { label: "Date Established", value: "createdAt" },
];

export function WarehousesToolbar({
  filterState,
  hasActiveFilters,
  totalFilteredCount,
  statusCounts,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onViewModeChange,
  onSortChange,
  onResetFilters,
}: WarehousesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3.5 shadow-none">
      {/* Top Row: Search & Filters & View Switcher */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by code, facility name, manager, or city..."
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 pr-8 text-xs font-medium border-slate-300 focus-visible:border-black focus-visible:ring-0 focus-visible:shadow-neo-primary"
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

        {/* Right Controls: Facility Type, Sort, View Toggle, Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Facility Type Dropdown */}
          <select
            aria-label="Filter by facility type"
            value={filterState.type}
            onChange={(e) => onTypeChange(e.target.value as "all" | WarehouseType)}
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-foreground focus:border-black focus:outline-none focus:shadow-neo-primary"
          >
            <option value="all">All Types</option>
            {WAREHOUSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            aria-label="Sort warehouses by"
            value={filterState.sortField}
            onChange={(e) => onSortChange(e.target.value as WarehouseSortField)}
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-foreground focus:border-black focus:outline-none focus:shadow-neo-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>

          {/* Sort Direction Toggle Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSortChange(filterState.sortField)}
            title={`Sort Order: ${filterState.sortOrder === "asc" ? "Ascending" : "Descending"}`}
            className="h-9 px-2.5 border-slate-300 text-xs font-mono"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <span className="uppercase text-[10px] font-bold">
              {filterState.sortOrder}
            </span>
          </Button>

          {/* View Mode Toggle Button Group */}
          <div className="flex items-center rounded-md border border-black bg-slate-100 p-0.5 shadow-neo-sm">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-all",
                filterState.viewMode === "grid"
                  ? "bg-white text-foreground border border-black shadow-neo-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={cn(
                "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-all",
                filterState.viewMode === "table"
                  ? "bg-white text-foreground border border-black shadow-neo-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 gap-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Row: Status Filter Pills with live counters */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Status:
        </span>

        {/* All */}
        <button
          type="button"
          onClick={() => onStatusChange("all")}
          className={cn(
            "flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[11px] font-medium transition-all",
            filterState.status === "all"
              ? "bg-black text-white border border-black shadow-neo-sm font-bold"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
          )}
        >
          <span>ALL</span>
          <span className="rounded bg-white/20 px-1 py-0.2 text-[10px]">
            {statusCounts.all}
          </span>
        </button>

        {/* Active */}
        <button
          type="button"
          onClick={() => onStatusChange("active")}
          className={cn(
            "flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[11px] font-medium transition-all",
            filterState.status === "active"
              ? "bg-emerald-600 text-white border border-black shadow-neo-sm font-bold"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
          )}
        >
          <span>ACTIVE</span>
          <span className="rounded bg-emerald-900/20 px-1 py-0.2 text-[10px]">
            {statusCounts.active}
          </span>
        </button>

        {/* Maintenance */}
        <button
          type="button"
          onClick={() => onStatusChange("maintenance")}
          className={cn(
            "flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[11px] font-medium transition-all",
            filterState.status === "maintenance"
              ? "bg-amber-600 text-white border border-black shadow-neo-sm font-bold"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
          )}
        >
          <span>MAINTENANCE</span>
          <span className="rounded bg-amber-900/20 px-1 py-0.2 text-[10px]">
            {statusCounts.maintenance}
          </span>
        </button>

        {/* Full */}
        <button
          type="button"
          onClick={() => onStatusChange("full")}
          className={cn(
            "flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[11px] font-medium transition-all",
            filterState.status === "full"
              ? "bg-red-600 text-white border border-black shadow-neo-sm font-bold"
              : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
          )}
        >
          <span>FULL</span>
          <span className="rounded bg-red-900/20 px-1 py-0.2 text-[10px]">
            {statusCounts.full}
          </span>
        </button>

        <div className="ml-auto font-mono text-[11px] text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{totalFilteredCount}</span> facilities
        </div>
      </div>
    </div>
  );
}
