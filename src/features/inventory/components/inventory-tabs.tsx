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
    <div className="flex border-[3px] border-ink font-mono text-[10px] font-bold uppercase shadow-hard-sm">
      {/* Tab 1: Stock Levels */}
      <button
        type="button"
        data-tab="stock_levels"
        onClick={() => onTabChange("stock_levels")}
        className={cn(
          "px-4 py-3 flex items-center gap-2 border-r-[3px] border-ink transition-colors cursor-pointer",
          activeTab === "stock_levels"
            ? "bg-ink text-paper"
            : "bg-paper text-ink hover:bg-ink/10"
        )}
      >
        <Boxes className="h-4 w-4" />
        <span>{t.inventory.stockLevelsTab}</span>
        <span className={cn("px-1.5 py-0.5", activeTab === "stock_levels" ? "bg-paper text-ink" : "bg-ink text-paper")}>
          {stockCount}
        </span>
      </button>

      {/* Tab 2: Movements */}
      <button
        type="button"
        data-tab="movements"
        onClick={() => onTabChange("movements")}
        className={cn(
          "px-4 py-3 flex items-center gap-2 transition-colors cursor-pointer",
          activeTab === "movements"
            ? "bg-ink text-paper"
            : "bg-paper text-ink hover:bg-ink/10"
        )}
      >
        <History className="h-4 w-4" />
        <span>{t.inventory.movementAuditTab}</span>
        <span className={cn("px-1.5 py-0.5", activeTab === "movements" ? "bg-paper text-ink" : "bg-ink text-paper")}>
          {movementsCount}
        </span>
      </button>
    </div>
  );
}

