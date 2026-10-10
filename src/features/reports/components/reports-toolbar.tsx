"use client";

import * as React from "react";
import { Search, RotateCcw, PieChart, Activity, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportTab } from "../types";
import { useI18n } from "@/lib/i18n/context";

interface ReportsToolbarProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onResetFilters: () => void;
  categories?: string[];
}

export function ReportsToolbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onResetFilters,
  categories = [],
}: ReportsToolbarProps) {
  const { t } = useI18n();
  const hasActiveFilters = searchQuery !== "" || (selectedCategory !== "all" && selectedCategory !== "");

  const TABS: { id: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "valuation", label: t.reports.tabValuation || "Stock Valuation", icon: PieChart },
    { id: "velocity", label: t.reports.tabMovement || "Stock Movement", icon: Activity },
    { id: "reorder", label: t.reports.tabLowStock || "Low Stock Items", icon: AlertCircle },
  ];

  return (
    <div className="flex flex-col gap-4 bg-white border-b-[3px] border-ink p-5">
      {/* Sub-report Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-[3px] border-ink pb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-none px-3 py-2 font-mono text-xs font-bold transition-all",
                isActive
                  ? "bg-acid text-white border-[3px] border-ink shadow-hard-sm"
                  : "bg-paper text-slate-700 hover:bg-slate-200/70 hover:text-foreground"
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
            placeholder={t.common.search || "Search SKU, product name, or category..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs border-[3px] border-ink focus:bg-[#fffef2] focus:shadow-[8px_8px_0_#543AFD,8px_8px_0_3px_#000]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-9 rounded-none border-[3px] border-ink bg-white px-3 font-mono text-xs font-semibold text-foreground focus:border-black focus:outline-none focus:ring-1 focus:ring-[#543afd]"
          >
            <option value="all">{t.common.all || "All Categories"}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-9 border-[3px] border-ink bg-white px-2.5 font-mono text-xs font-bold text-foreground shadow-neo-sm hover:bg-slate-100"
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              {t.common.reset || "Reset"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
