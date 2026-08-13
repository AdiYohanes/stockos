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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Valuation */}
      <Card className="border border-border bg-white shadow-none transition-all hover:border-slate-400">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Valuation
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-50 text-[#543afd] border border-purple-200">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-xl font-bold tracking-tight text-foreground truncate">
              {formatCurrency(metrics.totalValuation)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{metrics.totalItems}</span> total catalog items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Units on Hand */}
      <Card className="border border-border bg-white shadow-none transition-all hover:border-slate-400">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Units On-Hand
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-blue-600 border border-blue-200">
              <Boxes className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-xl font-bold tracking-tight text-foreground">
              {metrics.totalQuantity.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-muted-foreground font-sans">units</span>
            </div>
            <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Physical stock ready
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Stock Health Alerts (Clickable Filter Triggers) */}
      <Card className="border border-border bg-white shadow-none transition-all hover:border-slate-400">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Stock Health Alerts
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {/* Low stock pill */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab("stock_levels");
                  onSelectStatus(selectedStatus === "low_stock" ? "all" : "low_stock");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-semibold font-mono border transition-all",
                  selectedStatus === "low_stock"
                    ? "bg-amber-400 text-black border-black shadow-neo-sm font-bold"
                    : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{metrics.lowStockCount} Low</span>
              </button>

              {/* Out of stock pill */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab("stock_levels");
                  onSelectStatus(selectedStatus === "out_of_stock" ? "all" : "out_of_stock");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-semibold font-mono border transition-all",
                  selectedStatus === "out_of_stock"
                    ? "bg-rose-500 text-white border-black shadow-neo-sm font-bold"
                    : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-rose-600" />
                <span>{metrics.outOfStockCount} Out</span>
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
                    "flex items-center gap-1 rounded-sm px-1.5 py-1 text-xs font-semibold font-mono border transition-all",
                    selectedStatus === "overstocked"
                      ? "bg-blue-500 text-white border-black shadow-neo-sm font-bold"
                      : "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100"
                  )}
                >
                  <span>{metrics.overstockedCount} Over</span>
                </button>
              )}
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              Click pill to filter stock levels table
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Movement Activity */}
      <Card
        onClick={() => onSelectTab("movements")}
        className="border border-border bg-white shadow-none transition-all hover:border-slate-400 cursor-pointer"
      >
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Movement Activity
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>{metrics.todayMovementsCount} Logged</span>
              <span className="font-mono text-[10px] text-[#543afd] font-semibold underline underline-offset-2">
                View Logs →
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5 text-emerald-700">
                <ArrowDownRight className="h-3 w-3" /> In
              </span>
              <span>/</span>
              <span className="inline-flex items-center gap-0.5 text-rose-700">
                <ArrowUpRight className="h-3 w-3" /> Out
              </span>
              <span>/</span>
              <span className="text-amber-700">Δ Adjustments</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
