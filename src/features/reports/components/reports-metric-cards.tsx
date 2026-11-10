"use client";

import { DollarSign, TrendingUp, AlertTriangle, Coins } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { formatProductMoney } from "@/features/products/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { ReportTab } from "../types";
import type { TotalValuationDto, MovementSummaryDto, LowStockSummaryDto } from "../schemas/reports-rpc.schema";

interface ReportsMetricCardsProps {
  valuation: TotalValuationDto | null;
  movements: MovementSummaryDto | null;
  lowStock: LowStockSummaryDto | null;
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
}

export function ReportsMetricCards({ valuation, movements, lowStock, activeTab, onTabChange }: ReportsMetricCardsProps) {
  const { t } = useI18n();
  const unavailable = t.common.error;
  const cards = [
    { tab: "valuation" as const, title: t.reports.totalAssetValue, icon: DollarSign,
      value: valuation ? formatProductMoney(valuation.totalValuation) : unavailable,
      detail: valuation ? `${t.reports.cost}: ${formatProductMoney(valuation.totalCost)} · ${valuation.totalSKUs} SKU` : unavailable },
    { tab: "valuation" as const, title: t.reports.potentialGrossProfit, icon: Coins,
      value: valuation ? formatProductMoney(valuation.grossMargin) : unavailable,
      detail: valuation ? `${valuation.marginPercent}%` : unavailable },
    { tab: "velocity" as const, title: t.reports.movementVolume, icon: TrendingUp,
      value: movements ? `${formatNumber(movements.totalStockOutQty)} ${t.reports.sold}` : unavailable,
      detail: movements ? `${t.reports.received}: ${formatNumber(movements.totalStockInQty)} · ${t.reports.opening}: ${formatNumber(movements.totalOpeningQty)} · ${movements.distinctProductsCount} ${t.reports.products}` : unavailable },
    { tab: "reorder" as const, title: t.reports.stockAlerts, icon: AlertTriangle,
      value: lowStock ? `${formatNumber(lowStock.totalAlerts)} SKU` : unavailable,
      detail: lowStock ? `${lowStock.lowStockCount} ${t.reports.low} · ${lowStock.outOfStockCount} ${t.reports.empty}` : unavailable },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map((card, index) => <button key={index} type="button" onClick={() => onTabChange(card.tab)}
    className={cn("press min-w-0 text-left border-[3px] border-ink bg-white p-4 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-2 focus-visible:outline-offset-4", activeTab === card.tab ? "shadow-hard border-acid" : "shadow-hard-sm hover:shadow-hard")}>
    <div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] font-bold uppercase tracking-wider">{card.title}</span><card.icon className="h-4 w-4 shrink-0" /></div>
    <div className="mt-2 break-words font-mono text-xl font-bold">{card.value}</div>
    <div className="mt-1 break-words font-mono text-[11px] text-muted-foreground">{card.detail}</div>
  </button>)}</div>;
}
