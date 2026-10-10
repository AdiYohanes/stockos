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
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();

  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0]?.payload;
  if (!data) return null;

  const net = data.stockIn - data.stockOut;
  const total = data.stockIn + data.stockOut;

  return (
    <div className="border-[3px] border-ink bg-white p-3 text-ink shadow-hard-sm min-w-[170px]">
      <div className="flex items-center justify-between border-b-[2px] border-ink pb-2 mb-2">
        <span className="font-mono text-xs font-bold text-ink flex items-center gap-1 uppercase">
          <Calendar className="h-3.5 w-3.5 text-ink/70" />
          {label}
        </span>
        <span className="font-mono text-[10px] text-ink/60 font-bold uppercase tracking-widest">
          Total: {formatNumber(total)}
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 uppercase tracking-widest text-[10px] font-bold">
            <span className="h-2 w-2 bg-acid border border-ink shrink-0" />
            <span className="text-ink/80">{t.dashboard.stockIn}</span>
          </div>
          <span className="font-bold text-acid text-[11px]">
            +{formatNumber(data.stockIn)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 uppercase tracking-widest text-[10px] font-bold">
            <span className="h-2 w-2 bg-ink shrink-0" />
            <span className="text-ink/80">{t.dashboard.stockOut}</span>
          </div>
          <span className="font-bold text-ink text-[11px]">
            -{formatNumber(data.stockOut)}
          </span>
        </div>

        <div className="pt-2 mt-2 border-t-[2px] border-ink flex items-center justify-between gap-4">
          <span className="text-ink/80 font-bold uppercase text-[10px] tracking-widest">{t.dashboard.netFlow}</span>
          <span
            className={cn(
              "font-bold text-[10px] px-1.5 py-0.5 border-[3px] border-ink uppercase",
              net >= 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
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

interface StockMovementChartProps {
  movements?: {
    days7: StockMovementData;
    days30: StockMovementData;
  };
}

export function StockMovementChart({ movements }: StockMovementChartProps = {}) {
  const { t } = useI18n();
  const [timeframe, setTimeframe] = React.useState<"7d" | "30d">("7d");
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const currentData: StockMovementData = React.useMemo(() => {
    if (movements) {
      return timeframe === "7d" ? movements.days7 : movements.days30;
    }
    return timeframe === "7d" ? MOCK_STOCK_MOVEMENT_7D : MOCK_STOCK_MOVEMENT_30D;
  }, [movements, timeframe]);

  // Calculate high volume period
  const peakItem = React.useMemo(() => {
    return [...currentData.data].sort(
      (a, b) => b.stockIn + b.stockOut - (a.stockIn + a.stockOut)
    )[0];
  }, [currentData]);

  const avgMovement = React.useMemo(() => {
    const totalVolume = currentData.totalIn + currentData.totalOut;
    return Math.round(totalVolume / (currentData.data.length || 1));
  }, [currentData]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white border-[3px] border-ink shadow-hard-sm">
      <div className="pb-3 pt-5 px-5 space-y-4 shrink-0">
        {/* Header row: Title + Timeframe Selector + Net Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-ink bg-acid/10 text-acid shadow-hard-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink font-sans">
                {t.dashboard.stockMovement}
              </h3>
              <p className="text-[10px] text-ink/60 font-mono uppercase tracking-widest mt-0.5">
                {t.dashboard.stockMovementSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto max-w-full">
            {/* Timeframe switch */}
            <div className="flex items-center border-[3px] border-ink bg-paper p-0.5 shadow-hard-sm">
              <button
                type="button"
                onClick={() => setTimeframe("7d")}
                className={cn(
                  "px-3 py-1 font-mono text-[10px] font-bold transition-all cursor-pointer uppercase",
                  timeframe === "7d"
                    ? "bg-ink text-paper"
                    : "text-ink hover:bg-ink/10"
                )}
              >
                {t.dashboard.days7}
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("30d")}
                className={cn(
                  "px-3 py-1 font-mono text-[10px] font-bold transition-all cursor-pointer uppercase",
                  timeframe === "30d"
                    ? "bg-ink text-paper"
                    : "text-ink hover:bg-ink/10"
                )}
              >
                {t.dashboard.days30}
              </button>
            </div>

            {/* Net Badge */}
            <span
              className={cn(
                "px-2 py-1 font-mono text-[10px] font-bold uppercase border-[3px] border-ink",
                currentData.netChange >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              )}
            >
              {t.dashboard.net}: {currentData.netChange >= 0 ? "+" : ""}
              {formatNumber(currentData.netChange)}
            </span>
          </div>
        </div>

        {/* Informative Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t-[3px] border-ink">
          <div className="flex items-center gap-2 border-[3px] border-ink bg-paper p-2 press cursor-pointer hover:bg-white transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-acid/10 text-acid border border-ink">
              <ArrowDownToLine className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-sans text-[10px] uppercase font-bold text-ink/70">{t.dashboard.totalIn}</div>
              <div className="font-display text-lg font-bold text-acid truncate">
                +{formatNumber(currentData.totalIn)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-[3px] border-ink bg-paper p-2 press cursor-pointer hover:bg-white transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink/10 text-ink border border-ink">
              <ArrowUpFromLine className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-sans text-[10px] uppercase font-bold text-ink/70">{t.dashboard.totalOut}</div>
              <div className="font-display text-lg font-bold text-ink truncate">
                -{formatNumber(currentData.totalOut)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-[3px] border-ink bg-paper p-2 press cursor-pointer hover:bg-white transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-100 text-emerald-700 border border-ink">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-sans text-[10px] uppercase font-bold text-ink/70">{t.dashboard.peakPeriod}</div>
              <div className="font-display text-lg font-bold text-ink truncate">
                {peakItem?.period || "-"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-[3px] border-ink bg-paper p-2 press cursor-pointer hover:bg-white transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-ink border border-ink">
              <Activity className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-sans text-[10px] uppercase font-bold text-ink/70">{t.dashboard.dailyAverage}</div>
              <div className="font-display text-lg font-bold text-ink truncate">
                {formatNumber(avgMovement)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 flex-1 flex flex-col min-h-0">
        {/* Recharts Bar Chart */}
        <div className="flex-1 w-full min-h-[224px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentData.data}
                margin={{ top: 12, right: 10, left: -18, bottom: 4 }}
                barGap={4}
                barCategoryGap="25%"
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
                  name={t.dashboard.stockIn}
                  fill="#543afd"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                />

                <Bar
                  dataKey="stockOut"
                  name={t.dashboard.stockOut}
                  fill="#09090b"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-none border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-3 font-mono text-[10px] uppercase font-bold tracking-widest text-ink/70 shrink-0 mt-auto border-t-[3px] border-ink">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 border border-ink bg-[#543afd]" />
            <span className="text-ink">{t.dashboard.stockInbound}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 border border-ink bg-[#09090b]" />
            <span className="text-ink">{t.dashboard.stockOutbound}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
