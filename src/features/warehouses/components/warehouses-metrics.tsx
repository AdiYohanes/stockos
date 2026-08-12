"use client";

import * as React from "react";
import {
  Building2,
  CheckCircle2,
  PieChart,
  Boxes,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WarehouseMetrics, WarehouseStatus } from "../types";

interface WarehousesMetricsProps {
  metrics: WarehouseMetrics;
  selectedStatus: "all" | WarehouseStatus;
  onSelectStatus: (status: "all" | WarehouseStatus) => void;
}

export function WarehousesMetrics({
  metrics,
  selectedStatus,
  onSelectStatus,
}: WarehousesMetricsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getUtilizationBadgeColor = (val: number) => {
    if (val >= 90) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (val >= 75) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const getUtilizationBarColor = (val: number) => {
    if (val >= 90) return "bg-red-500";
    if (val >= 75) return "bg-amber-500";
    return "bg-[#543afd]";
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Facilities & Valuation */}
      <Card className="border border-border bg-white shadow-none transition-all hover:border-slate-400">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Storage Hubs
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-50 text-[#543afd] border border-purple-200">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-xl font-bold tracking-tight text-foreground truncate">
              {metrics.totalWarehouses}{" "}
              <span className="text-xs font-normal text-muted-foreground font-sans">
                Facilities
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground truncate">
              <span className="font-semibold text-foreground">
                {formatCurrency(metrics.totalValuation)}
              </span>{" "}
              assets
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Active & Operational Hubs (Click-to-filter) */}
      <Card
        onClick={() => onSelectStatus(selectedStatus === "active" ? "all" : "active")}
        className={cn(
          "border bg-white shadow-none transition-all cursor-pointer hover:border-emerald-400",
          selectedStatus === "active"
            ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20"
            : "border-border"
        )}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Facilities
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-xl font-bold tracking-tight text-foreground flex items-baseline gap-1.5">
              <span>{metrics.activeCount}</span>
              <span className="text-xs font-normal text-muted-foreground font-sans">
                / {metrics.totalWarehouses} operational
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
              {metrics.maintenanceCount > 0 ? (
                <span className="text-amber-600 font-medium">
                  {metrics.maintenanceCount} under maintenance
                </span>
              ) : (
                <span>100% network operational</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Average Capacity Utilization */}
      <Card className="border border-border bg-white shadow-none transition-all hover:border-slate-400">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Avg. Capacity Usage
            </span>
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border",
                getUtilizationBadgeColor(metrics.avgUtilization)
              )}
            >
              <Percent className="h-3 w-3" />
              <span>{metrics.avgUtilization}%</span>
            </div>
          </div>
          <div>
            <div className="font-heading text-xl font-bold tracking-tight text-foreground">
              {metrics.avgUtilization}%{" "}
              <span className="text-xs font-normal text-muted-foreground font-sans">
                Occupied
              </span>
            </div>
            {/* Visual mini progress bar */}
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={cn("h-full rounded-full transition-all", getUtilizationBarColor(metrics.avgUtilization))}
                style={{ width: `${Math.min(100, metrics.avgUtilization)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Total Stock Volume Stored */}
      <Card className="border border-border bg-white shadow-none transition-all hover:border-slate-400">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Units Stored
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-blue-600 border border-blue-200">
              <Boxes className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-xl font-bold tracking-tight text-foreground">
              {metrics.totalStockUnits.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-muted-foreground font-sans">
                units
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span>Across all warehouse zones</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
