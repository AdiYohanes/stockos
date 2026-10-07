"use client";

import * as React from "react";
import { Boxes, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1 border-b border-border bg-slate-50/60 dark:bg-slate-900/40 px-3 pt-2">
      {/* Tab 1: Stock Levels */}
      <button
        type="button"
        onClick={() => onTabChange("stock_levels")}
        className={cn(
          "relative flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer -mb-px border-b-2",
          activeTab === "stock_levels"
            ? "border-slate-900 text-foreground font-semibold dark:border-slate-100"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <Boxes className="h-3.5 w-3.5" />
        <span>{t.inventory.stockLevelsTab}</span>
        <span
          className={cn(
            "font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-sm border",
            activeTab === "stock_levels"
              ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900 font-semibold"
              : "bg-slate-100 text-muted-foreground border-border dark:bg-slate-800"
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
          "relative flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer -mb-px border-b-2",
          activeTab === "movements"
            ? "border-slate-900 text-foreground font-semibold dark:border-slate-100"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <History className="h-3.5 w-3.5" />
        <span>{t.inventory.movementAuditTab}</span>
        <span
          className={cn(
            "font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-sm border",
            activeTab === "movements"
              ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900 font-semibold"
              : "bg-slate-100 text-muted-foreground border-border dark:bg-slate-800"
          )}
        >
          {movementsCount}
        </span>
      </button>
    </div>
  );
}
