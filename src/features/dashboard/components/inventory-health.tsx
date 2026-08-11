import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HeartPulse } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import type { InventoryHealthData } from "../types";
import { MOCK_INVENTORY_HEALTH } from "../mock-data";

interface InventoryHealthProps {
  data?: InventoryHealthData;
}

export function InventoryHealth({ data = MOCK_INVENTORY_HEALTH }: InventoryHealthProps) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-[#dcfce7] text-[#15803d] shadow-neo-sm">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Inventory Health
              </CardTitle>
            </div>
          </div>
          <Badge
            variant={data.healthScore >= 80 ? "success" : "warning"}
          >
            {data.healthScore}% Optimal
          </Badge>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="space-y-1 pt-1">
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-border"
            role="progressbar"
            aria-valuenow={data.healthy.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Inventory distribution breakdown"
          >
            <div
              style={{ width: `${data.healthy.percentage}%` }}
              className="h-full bg-emerald-500 transition-all duration-300"
              title={`Healthy: ${data.healthy.percentage}%`}
            />
            <div
              style={{ width: `${data.lowStock.percentage}%` }}
              className="h-full bg-amber-500 transition-all duration-300"
              title={`Low Stock: ${data.lowStock.percentage}%`}
            />
            <div
              style={{ width: `${data.outOfStock.percentage}%` }}
              className="h-full bg-rose-500 transition-all duration-300"
              title={`Out of Stock: ${data.outOfStock.percentage}%`}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-1.5 px-4 sm:px-5 pb-4 pt-1 font-mono">
        {/* Healthy row */}
        <div className="flex items-center justify-between rounded-md border border-border bg-slate-50/50 px-3 py-2 text-xs transition-colors hover:bg-slate-100/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="font-sans font-semibold text-foreground">Healthy</span>
            <span className="text-[11px] text-muted-foreground">({data.healthy.percentage}%)</span>
          </div>
          <span className="font-bold text-foreground text-xs">
            ${formatNumber(data.healthy.value)}
          </span>
        </div>

        {/* Low Stock row */}
        <div className="flex items-center justify-between rounded-md border border-border bg-slate-50/50 px-3 py-2 text-xs transition-colors hover:bg-slate-100/60">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="font-sans font-semibold text-foreground">Low Stock</span>
            <span className="text-[11px] text-muted-foreground">({data.lowStock.percentage}%)</span>
          </div>
          <span className="font-bold text-foreground text-xs">
            ${formatNumber(data.lowStock.value)}
          </span>
        </div>

        {/* Out of Stock row */}
        <div className="flex items-center justify-between rounded-md border border-border bg-slate-50/50 px-3 py-2 text-xs transition-colors hover:bg-slate-100/60">
          <div className="flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            <span className="font-sans font-semibold text-foreground">Out of Stock</span>
            <span className="text-[11px] text-muted-foreground">({data.outOfStock.percentage}%)</span>
          </div>
          <span className="font-bold text-destructive text-xs">
            ${formatNumber(data.outOfStock.value)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
