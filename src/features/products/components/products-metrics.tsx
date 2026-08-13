"use client";

import * as React from "react";
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ProductMetrics } from "../types";

interface ProductsMetricsProps {
  metrics: ProductMetrics;
  selectedStatus?: string;
  onSelectStatus?: (status: "all" | "in_stock" | "low_stock" | "out_of_stock") => void;
}

export function ProductsMetrics({
  metrics,
  selectedStatus = "all",
  onSelectStatus,
}: ProductsMetricsProps) {
  const healthyPercentage =
    metrics.totalProducts > 0
      ? Math.round((metrics.inStockCount / metrics.totalProducts) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Products Card */}
      <Card
        onClick={() => onSelectStatus && onSelectStatus("all")}
        className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer ${
          selectedStatus === "all"
            ? "border-black shadow-neo-sm bg-white ring-1 ring-black"
            : "hover:border-slate-400 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Catalog
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-black bg-slate-100 text-foreground shadow-neo-sm">
            <Package className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {formatNumber(metrics.totalProducts)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate font-mono">
            Valuation: <span className="font-semibold text-foreground">{formatCurrency(metrics.totalValuation)}</span>
          </p>
        </div>
      </Card>

      {/* 2. In Stock Card */}
      <Card
        onClick={() => onSelectStatus && onSelectStatus("in_stock")}
        className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer ${
          selectedStatus === "in_stock"
            ? "border-black shadow-neo-sm bg-emerald-50/40 ring-1 ring-emerald-600"
            : "hover:border-slate-400 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            In Stock
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-black bg-[#dcfce7] text-[#15803d] shadow-neo-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#15803d]">
            {formatNumber(metrics.inStockCount)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate font-mono">
            <span className="font-semibold text-emerald-700">{healthyPercentage}%</span> of total inventory
          </p>
        </div>
      </Card>

      {/* 3. Low Stock Card */}
      <Card
        onClick={() => onSelectStatus && onSelectStatus("low_stock")}
        className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer ${
          selectedStatus === "low_stock"
            ? "border-black shadow-neo-sm bg-amber-50/40 ring-1 ring-amber-600"
            : "hover:border-slate-400 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Low Stock
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-black bg-[#fef3c7] text-[#b45309] shadow-neo-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#b45309]">
            {formatNumber(metrics.lowStockCount)}
          </div>
          <p className="mt-1 text-[11px] text-amber-700 truncate font-mono font-medium">
            Requires reordering
          </p>
        </div>
      </Card>

      {/* 4. Out of Stock Card */}
      <Card
        onClick={() => onSelectStatus && onSelectStatus("out_of_stock")}
        className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer ${
          selectedStatus === "out_of_stock"
            ? "border-black shadow-neo-sm bg-rose-50/40 ring-1 ring-rose-600"
            : "hover:border-slate-400 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Out of Stock
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-black bg-[#fee2e2] text-[#b91c1c] shadow-neo-sm">
            <XCircle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#b91c1c]">
            {formatNumber(metrics.outOfStockCount)}
          </div>
          <p className="mt-1 text-[11px] text-rose-700 truncate font-mono font-medium">
            Critical zero quantity
          </p>
        </div>
      </Card>
    </div>
  );
}
