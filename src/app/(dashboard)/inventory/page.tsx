import { Suspense } from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { InventoryContainer } from "@/features/inventory";
import {
  listInventoryStock,
  listInventoryEvents,
  getInventoryMetrics,
  getTextSuggestions,
} from "@/features/inventory/server";
import type { InventoryFilterState, InventoryTab, MovementType, StockStatus, InventorySortField } from "@/features/inventory/types";

export const metadata: Metadata = {
  title: "Inventory Control | StockOS",
  description: "Monitor shop stock levels, minimum thresholds, and movement history.",
};

function InventoryLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse">
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

export default async function InventoryPage({
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

  const integer = (key: string) =>
    /^[0-9]{1,10}$/.test(one(key) ?? "") ? Number(one(key)) : undefined;

  const tab = valid(
    z.enum(["stock_levels", "movements"]),
    one("tab"),
    "stock_levels" as InventoryTab
  );
  const search = valid(z.string().trim().max(120), one("q"), "");
  const category = valid(z.string().trim().max(120), one("category"), "");
  const health = valid(
    z.enum(["all", "in_stock", "low_stock", "out_of_stock"]),
    one("status"),
    "all" as const
  );
  const movementKind = valid(
    z.enum(["all", "opening", "receipt", "sold", "opname", "cost_adjustment"]),
    one("type"),
    "all" as const
  );
  const sort = valid(
    z.enum(["name", "sku", "currentStock", "sellingPrice", "createdAt"]),
    one("sort"),
    "name" as const
  );
  const order = valid(z.enum(["asc", "desc"]), one("order"), "asc" as const);
  const page = integer("page") ?? 1;
  const pageSize = integer("pageSize") ?? 10;

  const isStockTab = tab === "stock_levels";

  const stockInput = {
    search: isStockTab ? (search || undefined) : undefined,
    category: isStockTab && category && category !== "all" ? category : null,
    health: isStockTab && health !== "all" ? health : undefined,
    archive: "active" as const,
    sort: isStockTab ? sort : ("name" as const),
    direction: isStockTab ? order : ("asc" as const),
    page: isStockTab ? page : 1,
    pageSize: isStockTab ? pageSize : 25,
  };

  const eventsInput = {
    kind: !isStockTab && movementKind !== "all" ? movementKind : undefined,
    page: !isStockTab ? page : 1,
    pageSize: !isStockTab ? pageSize : 1,
  };

  const [stockResult, eventsResult, metricsResult, suggestionsResult] = await Promise.all([
    listInventoryStock(stockInput),
    listInventoryEvents(eventsInput),
    getInventoryMetrics({ archive: "active" }),
    getTextSuggestions({ kind: "category" }),
  ]);

  const failure = [stockResult, eventsResult, metricsResult, suggestionsResult].find(
    (res) => !res.ok
  );
  if (failure && !failure.ok && failure.code === "UNAUTHENTICATED") {
    redirect("/login");
  }

  const filterState: InventoryFilterState = {
    tab,
    searchQuery: search,
    status: health as StockStatus | "all",
    movementType: movementKind as MovementType | "all",
    category: category || "all",
    sortField: sort as InventorySortField,
    sortOrder: order,
    page,
    pageSize,
  };

  return (
    <Suspense fallback={<InventoryLoadingSkeleton />}>
      <InventoryContainer
        filterState={filterState}
        stockPage={stockResult.ok ? stockResult.data : null}
        eventsPage={eventsResult.ok ? eventsResult.data : null}
        metrics={metricsResult.ok ? metricsResult.data : null}
        categories={suggestionsResult.ok ? suggestionsResult.data : []}
        failure={failure && !failure.ok ? failure : null}
        totalProductsCount={stockResult.ok ? stockResult.data.total : 0}
        totalEventsCount={eventsResult.ok ? eventsResult.data.total : 0}
      />
    </Suspense>
  );
}
