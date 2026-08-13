"use client";

import * as React from "react";
import { ShoppingBag, Clock, PackageCheck, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { POSummaryMetrics } from "../types";

interface PurchaseOrdersMetricCardsProps {
  metrics: POSummaryMetrics;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PurchaseOrdersMetricCards({
  metrics,
  activeTab,
  onTabChange,
}: PurchaseOrdersMetricCardsProps) {
  const cards = [
    {
      id: "all",
      label: "Total Procurement",
      value: metrics.totalOrders,
      subValue: `$${metrics.totalSpend.toLocaleString()}`,
      icon: ShoppingBag,
      color: "border-slate-300 bg-white text-slate-900",
      activeBorder: "border-black shadow-neo-sm ring-2 ring-[#543afd]/30",
    },
    {
      id: "pending",
      label: "Pending / Issued",
      value: metrics.pendingCount,
      subValue: "Awaiting shipment",
      icon: Clock,
      color: "border-blue-200 bg-blue-50/50 text-blue-900",
      activeBorder: "border-black shadow-neo-sm ring-2 ring-blue-500/30",
    },
    {
      id: "partial",
      label: "Partially Received",
      value: metrics.partialCount,
      subValue: "In-progress intake",
      icon: PackageCheck,
      color: "border-amber-200 bg-amber-50/50 text-amber-900",
      activeBorder: "border-black shadow-neo-sm ring-2 ring-amber-500/30",
    },
    {
      id: "received",
      label: "Fully Received",
      value: metrics.receivedCount,
      subValue: "100% completed",
      icon: CheckCircle2,
      color: "border-emerald-200 bg-emerald-50/50 text-emerald-900",
      activeBorder: "border-black shadow-neo-sm ring-2 ring-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeTab === card.id;

        return (
          <Card
            key={card.id}
            onClick={() => onTabChange(card.id)}
            className={cn(
              "cursor-pointer border p-5 transition-all hover:-translate-y-0.5",
              card.color,
              isActive ? card.activeBorder : "hover:border-slate-400"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              <Icon className="h-5 w-5 opacity-70" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight">{card.value}</span>
              <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
                {card.subValue}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
