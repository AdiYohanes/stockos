"use client";

import * as React from "react";
import { Search, RotateCcw, PieChart, Activity, AlertCircle, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportTab } from "../types";

interface ReportsToolbarProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (wh: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onResetFilters: () => void;
}

const TABS: { id: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "valuation", label: "Valuation & Margin", icon: PieChart },
  { id: "velocity", label: "Movement & Velocity", icon: Activity },
  { id: "reorder", label: "Reorder Risk Forecast", icon: AlertCircle },
  { id: "performance", label: "Warehouse & Supplier", icon: Building2 },
];

export function ReportsToolbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedWarehouse,
  onWarehouseChange,
  selectedCategory,
  onCategoryChange,
  onResetFilters,
}: ReportsToolbarProps) {
  const hasActiveFilters = searchQuery !== "" || selectedWarehouse !== "all" || selectedCategory !== "all";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black bg-white p-4 shadow-neo-sm">
      {/* Sub-report Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs font-bold transition-all",
                isActive
                  ? "bg-[#543afd] text-white border border-black shadow-neo-sm"
                  : "bg-[#f8f9fa] text-slate-700 hover:bg-slate-200/70 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Instant Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search SKU, product name, or category..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs border border-slate-300 focus:border-black focus:ring-1 focus:ring-[#543afd]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 font-mono text-xs font-semibold text-foreground focus:border-black focus:outline-none focus:ring-1 focus:ring-[#543afd]"
          >
            <option value="all">All Categories</option>
            <option value="Electronics & Sensors">Electronics & Sensors</option>
            <option value="Industrial Tools">Industrial Tools</option>
            <option value="Raw Materials">Raw Materials</option>
            <option value="Packaging Materials">Packaging Materials</option>
            <option value="Safety Gear & Apparel">Safety Gear & Apparel</option>
          </select>

          {/* Warehouse Filter */}
          <select
            value={selectedWarehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 font-mono text-xs font-semibold text-foreground focus:border-black focus:outline-none focus:ring-1 focus:ring-[#543afd]"
          >
            <option value="all">All Warehouses</option>
            <option value="Main Logistics Hub">Main Logistics Hub</option>
            <option value="West Coast Annex">West Coast Annex</option>
            <option value="North Storage Depot">North Storage Depot</option>
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-9 border border-black bg-white px-2.5 font-mono text-xs font-bold text-foreground shadow-neo-sm hover:bg-slate-100"
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
