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
    <div className="flex border-[3px] border-border font-mono text-[10px] font-bold uppercase">
      {/* Tab 1: Stock Levels */}
      <button
        type="button"
        onClick={() => onTabChange("stock_levels")}
        className={cn(
          "px-4 py-3 flex items-center gap-2 border-r-[3px] border-border transition-colors",
          activeTab === "stock_levels"
            ? "bg-foreground text-background"
            : "bg-card text-foreground hover:bg-primary hover:text-foreground"
        )}
      >
        <Boxes className="h-4 w-4" />
        <span>{t.inventory.stockLevelsTab}</span>
        <span className={cn("px-1.5 py-0.5", activeTab === "stock_levels" ? "bg-background text-foreground" : "bg-border text-background")}>
          {stockCount}
        </span>
      </button>

      {/* Tab 2: Movements */}
      <button
        type="button"
        onClick={() => onTabChange("movements")}
        className={cn(
          "px-4 py-3 flex items-center gap-2 transition-colors",
          activeTab === "movements"
            ? "bg-foreground text-background"
            : "bg-card text-foreground hover:bg-primary hover:text-foreground"
        )}
      >
        <History className="h-4 w-4" />
        <span>{t.inventory.movementAuditTab}</span>
        <span className={cn("px-1.5 py-0.5", activeTab === "movements" ? "bg-background text-foreground" : "bg-border text-background")}>
          {movementsCount}
        </span>
      </button>
    </div>
  );
}

