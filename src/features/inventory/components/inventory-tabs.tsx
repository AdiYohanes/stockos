"use client";

import * as React from "react";
import { Boxes, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryTab } from "../types";

interface InventoryTabsProps {
  activeTab: InventoryTab;
  onTabChange: (tab: InventoryTab) => void;
  stockCount: number;
  movementsCount: number;
}

export function InventoryTabs({
  activeTab,
  onTabChange,
  stockCount,
  movementsCount,
}: InventoryTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-1">
      {/* Tab 1: Stock Levels */}
      <button
        type="button"
        onClick={() => onTabChange("stock_levels")}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2 text-xs font-semibold rounded-md border transition-all",
          activeTab === "stock_levels"
            ? "bg-[#543afd] text-white border-black shadow-neo-sm"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-foreground"
        )}
      >
        <Boxes className="h-4 w-4" />
        <span>Stock Levels & Warehouse Health</span>
        <span
          className={cn(
            "font-mono text-[10px] px-1.5 py-0.5 rounded-sm border",
            activeTab === "stock_levels"
              ? "bg-white text-black border-black font-bold"
              : "bg-slate-100 text-slate-600 border-slate-300"
          )}
        >
          {stockCount}
        </span>
      </button>

      {/* Tab 2: Movements */}
      <button
        type="button"
        onClick={() => onTabChange("movements")}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2 text-xs font-semibold rounded-md border transition-all",
          activeTab === "movements"
            ? "bg-[#543afd] text-white border-black shadow-neo-sm"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-foreground"
        )}
      >
        <History className="h-4 w-4" />
        <span>Stock Movement Audit Logs</span>
        <span
          className={cn(
            "font-mono text-[10px] px-1.5 py-0.5 rounded-sm border",
            activeTab === "movements"
              ? "bg-white text-black border-black font-bold"
              : "bg-slate-100 text-slate-600 border-slate-300"
          )}
        >
          {movementsCount}
        </span>
      </button>
    </div>
  );
}
