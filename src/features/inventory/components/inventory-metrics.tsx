"use client";

import * as React from "react";
import {
  DollarSign,
  Boxes,
  AlertTriangle,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { InventoryMetrics, StockStatus } from "../types";

interface InventoryMetricsProps {
  metrics: InventoryMetrics;
  selectedStatus: "all" | StockStatus;
  onSelectStatus: (status: "all" | StockStatus) => void;
  onSelectTab: (tab: "stock_levels" | "movements") => void;
}

export function InventoryMetricsView({
  metrics,
  selectedStatus,
  onSelectStatus,
  onSelectTab,
}: InventoryMetricsProps) {
  const { t } = useI18n();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 divide-y border border-border bg-card rounded-md overflow-hidden sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
      {/* 1. Total Valuation */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {t.inventory.totalValuation}
          </span>
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        </div>
        <div className="mt-2">
          <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
            {formatCurrency(metrics.totalValuation)}
          </div>
          <p className="mt-1 font-mono tabular-nums text-[11px] text-muted-foreground truncate">
            <span className="font-medium text-foreground">{metrics.totalItems}</span> {t.inventory.totalCatalogItems}
          </p>
        </div>
      </div>

      {/* 2. Total Units on Hand */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {t.inventory.totalUnitsOnHand}
          </span>
          <Boxes className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        </div>
        <div className="mt-2">
          <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
            {metrics.totalQuantity.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-muted-foreground font-sans">{t.inventory.units}</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 font-mono tabular-nums text-[11px] text-muted-foreground truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            <span className="truncate">{t.inventory.physicalStockReady}</span>
          </p>
        </div>
      </div>

      {/* 3. Stock Health Alerts (Clickable Filter Triggers) */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {t.inventory.stockHealthAlerts}
          </span>
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Low stock pill */}
            <button
              type="button"
              onClick={() => {
                onSelectTab("stock_levels");
                onSelectStatus(selectedStatus === "low_stock" ? "all" : "low_stock");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium font-sans border transition-colors cursor-pointer",
                selectedStatus === "low_stock"
                  ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
              <span className="font-mono tabular-nums">{metrics.lowStockCount}</span>
              <span>{t.inventory.low}</span>
            </button>

            {/* Out of stock pill */}
            <button
              type="button"
              onClick={() => {
                onSelectTab("stock_levels");
                onSelectStatus(selectedStatus === "out_of_stock" ? "all" : "out_of_stock");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium font-sans border transition-colors cursor-pointer",
                selectedStatus === "out_of_stock"
                  ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
              <span className="font-mono tabular-nums">{metrics.outOfStockCount}</span>
              <span>{t.inventory.out}</span>
            </button>

            {/* Overstocked pill */}
            {metrics.overstockedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectTab("stock_levels");
                  onSelectStatus(selectedStatus === "overstocked" ? "all" : "overstocked");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium font-sans border transition-colors cursor-pointer",
                  selectedStatus === "overstocked"
                    ? "bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-50 text-slate-700 border-border hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span className="font-mono tabular-nums">{metrics.overstockedCount}</span>
                <span>{t.inventory.over}</span>
              </button>
            )}
          </div>
          <p className="mt-1 font-mono tabular-nums text-[10px] text-muted-foreground truncate">
            {t.inventory.clickPillToFilter}
          </p>
        </div>
      </div>

      {/* 4. Movement Activity */}
      <button
        type="button"
        onClick={() => onSelectTab("movements")}
        className="group flex flex-col justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-900/30"
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <span className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {t.inventory.movementActivity}
          </span>
          <Activity className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 group-hover:text-muted-foreground transition-colors" />
        </div>
        <div className="mt-2">
          <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
            {metrics.todayMovementsCount}{" "}
            <span className="text-xs font-normal text-muted-foreground font-sans">{t.inventory.logged}</span>
          </div>
          <p className="mt-1 flex items-center gap-2 font-mono tabular-nums text-[11px] text-muted-foreground truncate">
            <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400">
              <ArrowDownRight className="h-3 w-3" /> {t.inventory.inLabel}
            </span>
            <span>/</span>
            <span className="inline-flex items-center gap-0.5 text-rose-700 dark:text-rose-400">
              <ArrowUpRight className="h-3 w-3" /> {t.inventory.outLabel}
            </span>
            <span>/</span>
            <span className="text-amber-700 dark:text-amber-400">Δ {t.inventory.adjustments}</span>
          </p>
        </div>
      </button>
    </div>
  );
}
