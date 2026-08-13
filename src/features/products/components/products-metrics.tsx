"use client";

import * as React from "react";
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { MetricCard } from "@/components/shared";
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
      <MetricCard
        title="Total Catalog"
        value={formatNumber(metrics.totalProducts)}
        subtext={`Valuation: ${formatCurrency(metrics.totalValuation)}`}
        icon={Package}
        isActive={selectedStatus === "all"}
        onClick={() => onSelectStatus && onSelectStatus("all")}
      />
      <MetricCard
        title="In Stock"
        value={formatNumber(metrics.inStockCount)}
        subtext={`${healthyPercentage}% of total inventory`}
        icon={CheckCircle2}
        isActive={selectedStatus === "in_stock"}
        onClick={() => onSelectStatus && onSelectStatus("in_stock")}
      />
      <MetricCard
        title="Low Stock"
        value={formatNumber(metrics.lowStockCount)}
        subtext="Requires reordering"
        icon={AlertTriangle}
        isActive={selectedStatus === "low_stock"}
        onClick={() => onSelectStatus && onSelectStatus("low_stock")}
      />
      <MetricCard
        title="Out of Stock"
        value={formatNumber(metrics.outOfStockCount)}
        subtext="Critical zero quantity"
        icon={XCircle}
        isActive={selectedStatus === "out_of_stock"}
        onClick={() => onSelectStatus && onSelectStatus("out_of_stock")}
      />
    </div>
  );
}
