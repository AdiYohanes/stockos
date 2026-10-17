import { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ReportsContainer } from "@/features/reports";
import { getValuationReport, getMovementReport, getLowStockReport } from "@/features/reports/server";
import { getTextSuggestions } from "@/features/products/server";
import { getShopSettings } from "@/features/settings/server";
import { getReportDates } from "@/features/reports/dates";
import type { ReportTab, ReportTimeframe } from "@/features/reports/types";

export const metadata: Metadata = { title: "Laporan | StockOS", description: "Laporan valuasi dan pergerakan stok warung." };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const one = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const valid = <T,>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T } }, value: unknown, fallback: T): T => {
    const result = schema.safeParse(value);
    return result.success && result.data !== undefined ? result.data : fallback;
  };
  const tab = valid(z.enum(["valuation", "velocity", "reorder"]), one("tab"), "valuation" as ReportTab);
  const timeframe = valid(z.enum(["7d", "30d", "90d", "12m"]), one("timeframe"), "30d" as ReportTimeframe);
  const search = valid(z.string().trim().max(120), one("q"), "");
  const category = valid(z.string().trim().max(120), one("category"), "all");
  const integer = (key: string, max: number, fallback: number) => valid(z.number().int().min(1).max(max), Number(one(key)), fallback);
  const page = integer("page", 1_000_000_000, 1), pageSize = integer("pageSize", 100, 25);
  const filters = { search: search || undefined, category: category && category !== "all" ? category : undefined };
  const mode = (active: ReportTab) => tab === active ? { mode: "screen" as const, page, pageSize } : { mode: "summary" as const };
  let settings = await getShopSettings();
  if (!settings.ok) {
    if (settings.code === "UNAUTHENTICATED") redirect("/login");
    return <ReportsContainer filterState={{ tab, timeframe, searchQuery: search, category, page, pageSize }} failure={settings} />;
  }
  let dates = getReportDates(timeframe, settings.data.timezone);
  const [valuationResult, initialMovement, lowStockResult, suggestionsResult] = await Promise.all([
    getValuationReport({ ...filters, ...mode("valuation") }),
    getMovementReport({ ...filters, ...dates, ...mode("velocity") }),
    getLowStockReport({ ...filters, ...mode("reorder") }),
    getTextSuggestions({ kind: "category" }),
  ]);
  let movementResult = initialMovement;
  if (!movementResult.ok && movementResult.code === "VERSION_CONFLICT") {
    settings = await getShopSettings();
    if (settings.ok) {
      dates = getReportDates(timeframe, settings.data.timezone);
      movementResult = await getMovementReport({ ...filters, ...dates, ...mode("velocity") });
    } else movementResult = settings;
  }
  const results = { valuation: valuationResult, velocity: movementResult, reorder: lowStockResult };
  if (Object.values(results).some(result => !result.ok && result.code === "UNAUTHENTICATED")) redirect("/login");
  const active = results[tab];
  return <ReportsContainer filterState={{ tab, timeframe, searchQuery: search, category, page, pageSize }}
    valuationReport={valuationResult.ok ? valuationResult.data : null} movementReport={movementResult.ok ? movementResult.data : null}
    lowStockReport={lowStockResult.ok ? lowStockResult.data : null} categories={suggestionsResult.ok ? suggestionsResult.data : []}
    failure={!active.ok ? active : null} />;
}
