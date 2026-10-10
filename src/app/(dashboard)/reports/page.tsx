import { Suspense } from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ReportsContainer } from "@/features/reports";
import {
  getValuationReport,
  getMovementReport,
  getLowStockReport,
} from "@/features/reports/server";
import { getTextSuggestions } from "@/features/products/server";
import type { ReportTab, ReportTimeframe } from "@/features/reports/types";

export const metadata: Metadata = {
  title: "Laporan | StockOS",
  description: "Laporan valuasi aset, mutasi stok, dan analisis pengadaan toko.",
};

function getTimeframeDates(tf: ReportTimeframe = "30d"): { startDate: string; endDate: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let days = 30;
  if (tf === "7d") days = 7;
  else if (tf === "30d") days = 30;
  else if (tf === "90d") days = 90;
  else if (tf === "12m") days = 365;

  const start = new Date(end.getTime() - (days + 1) * 86400000);
  const toYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { startDate: toYmd(start), endDate: toYmd(end) };
}

function ReportsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse w-full">
      <div className="h-16 w-72 bg-ink/10 border-[3px] border-ink" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white border-[3px] border-ink shadow-hard-sm" />
        ))}
      </div>
      <div className="h-96 bg-white border-[3px] border-ink shadow-hard-lg" />
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? params[key] : undefined);

  const valid = <T,>(
    schema: { safeParse: (value: unknown) => { success: boolean; data?: T } },
    value: unknown,
    fallback: T
  ): T => {
    const result = schema.safeParse(value);
    return result.success && result.data !== undefined ? result.data : fallback;
  };

  const tab = valid(
    z.enum(["valuation", "velocity", "reorder"]),
    one("tab"),
    "valuation" as ReportTab
  );

  const timeframe = valid(
    z.enum(["7d", "30d", "90d", "12m"]),
    one("timeframe"),
    "30d" as ReportTimeframe
  );

  const search = valid(z.string().trim().max(120), one("q"), "");
  const category = valid(z.string().trim().max(120), one("category"), "");

  const catFilter = category && category !== "all" ? category : undefined;
  const searchFilter = search ? search : undefined;

  const { startDate, endDate } = getTimeframeDates(timeframe);

  const [valuationResult, movementResult, lowStockResult, suggestionsResult] = await Promise.all([
    getValuationReport({ search: searchFilter, category: catFilter }),
    getMovementReport({ startDate, endDate, category: catFilter }),
    getLowStockReport({ search: searchFilter, category: catFilter }),
    getTextSuggestions({ kind: "category" }),
  ]);

  const failure = [valuationResult, movementResult, lowStockResult, suggestionsResult].find(
    (res) => !res.ok
  );

  if (failure && !failure.ok && failure.code === "UNAUTHENTICATED") {
    redirect("/login");
  }

  const filterState = {
    tab,
    timeframe,
    searchQuery: search,
    category: category || "all",
  };

  return (
    <Suspense fallback={<ReportsLoadingSkeleton />}>
      <ReportsContainer
        filterState={filterState}
        valuationReport={valuationResult.ok ? valuationResult.data : null}
        movementReport={movementResult.ok ? movementResult.data : null}
        lowStockReport={lowStockResult.ok ? lowStockResult.data : null}
        categories={suggestionsResult.ok ? suggestionsResult.data : []}
        failure={failure && !failure.ok ? failure : null}
      />
    </Suspense>
  );
}
