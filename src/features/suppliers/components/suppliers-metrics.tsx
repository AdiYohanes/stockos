"use client";

import * as React from "react";
import { Users, CheckCircle2, DollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupplierMetrics, SupplierStatus } from "../types";

interface SuppliersMetricsProps {
  metrics: SupplierMetrics;
  selectedStatus: "all" | SupplierStatus;
  onSelectStatus: (status: "all" | SupplierStatus) => void;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}K`;
  }
  return `Rp ${amount.toLocaleString()}`;
}

export function SuppliersMetrics({
  metrics,
  selectedStatus,
  onSelectStatus,
}: SuppliersMetricsProps) {
  const cards = [
    {
      label: "Total Suppliers",
      value: metrics.totalSuppliers.toString(),
      icon: Users,
      filterStatus: "all" as const,
      color: "text-slate-700",
      bgColor: "bg-slate-50",
    },
    {
      label: "Active Vendors",
      value: metrics.activeCount.toString(),
      icon: CheckCircle2,
      filterStatus: "active" as const,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Total Spend",
      value: formatCurrency(metrics.totalSpend),
      icon: DollarSign,
      filterStatus: null,
      color: "text-violet-700",
      bgColor: "bg-violet-50",
    },
    {
      label: "Avg On-Time",
      value: `${metrics.avgOnTimeDelivery}%`,
      icon: Clock,
      filterStatus: null,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const isClickable = card.filterStatus !== null;
        const isSelected = isClickable && selectedStatus === card.filterStatus;
        const Icon = card.icon;

        return (
          <button
            key={card.label}
            type="button"
            disabled={!isClickable}
            onClick={() => {
              if (isClickable) onSelectStatus(card.filterStatus!);
            }}
            className={cn(
              "group relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-all",
              isClickable && "cursor-pointer",
              !isClickable && "cursor-default",
              isSelected
                ? "border-[1.5px] border-black bg-white shadow-neo-sm"
                : "border-border bg-white hover:border-slate-300"
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  card.bgColor
                )}
              >
                <Icon className={cn("h-4 w-4", card.color)} />
              </div>
              {isSelected && (
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-primary">
                  FILTERED
                </span>
              )}
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <p className="font-heading text-xl font-bold tracking-tight text-foreground mt-0.5">
                {card.value}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
