"use client";

import * as React from "react";
import {
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StockMovementData, StockMovementItem } from "../types";
import { MOCK_STOCK_MOVEMENT_7D, MOCK_STOCK_MOVEMENT_30D } from "../mock-data";

interface TooltipPayloadItem {
  name: string;
  value: number;
  dataKey: string;
  color: string;
  payload: StockMovementItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0]?.payload;
  if (!data) return null;

  const net = data.stockIn - data.stockOut;
  const total = data.stockIn + data.stockOut;

  return (
    <div className="rounded-md border border-black bg-white p-3 text-foreground shadow-neo min-w-[170px]">
      <div className="flex items-center justify-between border-b border-border pb-1.5 mb-2">
        <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground font-medium">
          Total: {formatNumber(total)}
        </span>
      </div>

      <div className="space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#543afd] shrink-0" />
            <span className="text-muted-foreground font-medium">Stok Masuk</span>
          </div>
          <span className="font-bold text-[#543afd]">
            +{formatNumber(data.stockIn)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#09090b] shrink-0" />
            <span className="text-muted-foreground font-medium">Stok Keluar</span>
          </div>
          <span className="font-bold text-[#09090b]">
            -{formatNumber(data.stockOut)}
          </span>
        </div>

        <div className="pt-1.5 mt-1 border-t border-border flex items-center justify-between gap-4">
          <span className="text-muted-foreground font-medium">Alur Neto</span>
          <span
            className={cn(
              "font-bold text-xs px-1.5 py-0.2 rounded-sm border border-black",
              net >= 0
                ? "bg-[#dcfce7] text-[#15803d]"
                : "bg-[#fee2e2] text-[#b91c1c]"
            )}
          >
            {net >= 0 ? "+" : ""}
            {formatNumber(net)}
          </span>
        </div>
      </div>
    </div>
  );
}

const emptySubscribe = () => () => {};

export function StockMovementChart() {
  const [timeframe, setTimeframe] = React.useState<"7d" | "30d">("7d");
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const currentData: StockMovementData =
    timeframe === "7d" ? MOCK_STOCK_MOVEMENT_7D : MOCK_STOCK_MOVEMENT_30D;

  // Calculate high volume period
  const peakItem = React.useMemo(() => {
    return [...currentData.data].sort(
      (a, b) => b.stockIn + b.stockOut - (a.stockIn + a.stockOut)
    )[0];
  }, [currentData]);

  const avgMovement = React.useMemo(() => {
    const totalVolume = currentData.totalIn + currentData.totalOut;
    return Math.round(totalVolume / currentData.data.length);
  }, [currentData]);

  return (
    <Card className="flex flex-col h-full justify-between overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5 space-y-3">
        {/* Header row: Title + Timeframe Selector + Net Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-[#ede9fe] text-[#543afd] shadow-neo-sm">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Pergerakan Stok
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Alur inventaris masuk vs keluar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Timeframe switch */}
            <div className="flex items-center rounded-md border border-border bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => setTimeframe("7d")}
                className={cn(
                  "rounded-sm px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer",
                  timeframe === "7d"
                    ? "bg-white text-foreground border border-black shadow-neo-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("30d")}
                className={cn(
                  "rounded-sm px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer",
                  timeframe === "30d"
                    ? "bg-white text-foreground border border-black shadow-neo-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                30 Hari
              </button>
            </div>

            {/* Net Badge */}
            <Badge
              variant={currentData.netChange >= 0 ? "success" : "destructive"}
            >
              Neto: {currentData.netChange >= 0 ? "+" : ""}
              {formatNumber(currentData.netChange)}
            </Badge>
          </div>
        </div>

        {/* Informative Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border">
          <div className="flex items-center gap-2 rounded-md bg-slate-50 border border-border p-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#ede9fe] text-[#543afd]">
              <ArrowDownToLine className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">Total Masuk</div>
              <div className="font-mono text-xs font-bold text-[#543afd] truncate">
                +{formatNumber(currentData.totalIn)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-slate-50 border border-border p-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-[#09090b]">
              <ArrowUpFromLine className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">Total Keluar</div>
              <div className="font-mono text-xs font-bold text-[#09090b] truncate">
                -{formatNumber(currentData.totalOut)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-slate-50 border border-border p-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">Periode Puncak</div>
              <div className="font-mono text-xs font-bold text-foreground truncate">
                {peakItem?.period || "-"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-slate-50 border border-border p-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">Rata-rata / Hari</div>
              <div className="font-mono text-xs font-bold text-foreground truncate">
                {formatNumber(avgMovement)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-4 pb-4 pt-1">
        {/* Recharts Bar Chart */}
        <div className="h-56 sm:h-64 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentData.data}
                margin={{ top: 12, right: 10, left: -18, bottom: 4 }}
                barGap={3}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-border"
                />

                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={{ stroke: "currentColor", className: "text-border" }}
                  tick={{
                    fontSize: 11,
                    fontFamily: "var(--font-space-mono)",
                    fontWeight: 600,
                    fill: "currentColor",
                    className: "text-muted-foreground",
                  }}
                  dy={4}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 11,
                    fontFamily: "var(--font-space-mono)",
                    fill: "currentColor",
                    className: "text-muted-foreground",
                  }}
                  dx={-2}
                />

                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ fill: "currentColor", opacity: 0.05 }}
                />

                <Bar
                  dataKey="stockIn"
                  name="Stok Masuk"
                  fill="#543afd"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />

                <Bar
                  dataKey="stockOut"
                  name="Stok Keluar"
                  fill="#09090b"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 font-mono text-[11px] font-semibold text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-xs border border-black bg-[#543afd]" />
            <span className="text-foreground">Stok Masuk (Inbound)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-xs border border-black bg-[#09090b]" />
            <span className="text-foreground">Stok Keluar (Outbound)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
