"use client";

import * as React from "react";
import { Search, X, ArrowUpDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SupplierFilterState,
  SupplierSortField,
  SupplierStatus,
  SupplierTier,
} from "../types";
import { SUPPLIER_CATEGORIES } from "../mock-data";

interface SuppliersToolbarProps {
  filterState: SupplierFilterState;
  hasActiveFilters: boolean;
  totalFilteredCount: number;
  statusCounts: {
    all: number;
    active: number;
    on_hold: number;
    inactive: number;
  };
  onSearchChange: (query: string) => void;
  onStatusChange: (status: "all" | SupplierStatus) => void;
  onTierChange: (tier: "all" | SupplierTier) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (field: SupplierSortField) => void;
  onResetFilters: () => void;
}

const STATUS_PILLS: { value: "all" | SupplierStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "inactive", label: "Inactive" },
];

const SORT_OPTIONS: { value: SupplierSortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "code", label: "Code" },
  { value: "tier", label: "Tier" },
  { value: "leadTime", label: "Lead Time" },
  { value: "orders", label: "Orders" },
  { value: "spend", label: "Total Spend" },
  { value: "onTime", label: "On-Time %" },
  { value: "createdAt", label: "Created" },
];

export function SuppliersToolbar({
  filterState,
  hasActiveFilters,
  totalFilteredCount,
  statusCounts,
  onSearchChange,
  onStatusChange,
  onTierChange,
  onCategoryChange,
  onSortChange,
  onResetFilters,
}: SuppliersToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3">
      {/* Row 1: Search + Dropdowns + Sort */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-xs border-border focus:border-black focus:shadow-[2px_2px_0px_#543afd]"
          />
          {filterState.searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Tier Dropdown */}
        <Select
          value={filterState.tier}
          onValueChange={(val) => val && onTierChange(val as "all" | SupplierTier)}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs border-border">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Dropdown */}
        <Select
          value={filterState.category}
          onValueChange={(val) => val && onCategoryChange(val)}
        >
          <SelectTrigger className="h-8 w-[160px] text-xs border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SUPPLIER_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filterState.sortField}
          onValueChange={(val) => val && onSortChange(val as SupplierSortField)}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs border-border">
            <ArrowUpDown className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Row 2: Status pills + result count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {STATUS_PILLS.map((pill) => {
            const count =
              statusCounts[pill.value as keyof typeof statusCounts] ?? 0;
            const isActive = filterState.status === pill.value;

            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => onStatusChange(pill.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all",
                  isActive
                    ? "border-[1.5px] border-black bg-foreground text-white shadow-neo-sm"
                    : "border border-border bg-white text-muted-foreground hover:border-slate-400 hover:text-foreground"
                )}
              >
                {pill.label}
                <span
                  className={cn(
                    "tabular-nums",
                    isActive ? "text-white/80" : "text-muted-foreground/60"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {totalFilteredCount} result{totalFilteredCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
