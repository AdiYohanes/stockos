"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportsHeader } from "./reports-header";
import { ReportsMetricCards } from "./reports-metric-cards";
import { ReportsToolbar } from "./reports-toolbar";
import { ValuationReportView } from "./valuation-report-view";
import { MovementVelocityView } from "./movement-velocity-view";
import { ReorderRiskView } from "./reorder-risk-view";
import { ExportReportModal } from "./export-report-modal";
import { ReportDetailSheet } from "./report-detail-sheet";
import {
  mapValuationReport,
  mapMovementReport,
  mapLowStockReport,
} from "../adapters";
import { exportReportAction } from "../actions";
import type {
  ReportTab,
  ReportTimeframe,
  ValuationSummary,
  MovementVelocityItem,
  MovementTrendPoint,
  ReorderRiskItem,
} from "../types";
import type {
  ValuationReportDto,
  MovementReportDto,
  LowStockReportDto,
} from "../schemas/reports-rpc.schema";
import type { ProductFailure } from "@/features/products/schemas/product-rpc.schema";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

export interface ReportsFilterState {
  tab: ReportTab;
  timeframe: ReportTimeframe;
  searchQuery: string;
  category: string;
  page: number;
  pageSize: number;
}

export interface ReportsContainerProps {
  filterState: ReportsFilterState;
  valuationReport?: ValuationReportDto | null;
  movementReport?: MovementReportDto | null;
  lowStockReport?: LowStockReportDto | null;
  categories?: string[];
  failure?: ProductFailure | null;
}

export function ReportsContainer({
  filterState,
  valuationReport = null,
  movementReport = null,
  lowStockReport = null,
  categories = [],
  failure = null,
}: ReportsContainerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [exportError, setExportError] = React.useState<string | null>(null);
  const exporting = React.useRef(false);
  const activeReport = filterState.tab === "valuation" ? valuationReport : filterState.tab === "velocity" ? movementReport : lowStockReport;
  const detail = activeReport?.mode === "screen" ? activeReport : null;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  // Slide-over inspection state
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = React.useState<"velocity" | "reorder" | null>(null);

  // Modal export state
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Synchronize URL search params
  const updateFilters = React.useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!Object.hasOwn(updates, "page")) params.delete("page");
      Object.entries(updates).forEach(([key, value]) => {
        if (
          !value ||
          value === "all" ||
          (key === "tab" && value === "valuation") ||
          (key === "timeframe" && value === "30d")
        ) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      startTransition(() => {
        router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  // Derived reports data
  const valuationSummary: ValuationSummary = React.useMemo(() => {
    if (!valuationReport) {
      return {
        totalValuation: "0",
        totalCost: "0",
        grossMargin: "0",
        marginPercent: 0,
        totalSKUs: 0,
        categories: [],
      };
    }
    return mapValuationReport(valuationReport);
  }, [valuationReport]);

  const { velocityList, movementTrends } = React.useMemo<{
    velocityList: MovementVelocityItem[];
    movementTrends: MovementTrendPoint[];
  }>(() => {
    if (!movementReport) {
      return { velocityList: [], movementTrends: [] };
    }
    const mapped = mapMovementReport(movementReport);
    return {
      velocityList: mapped.items,
      movementTrends: mapped.trends,
    };
  }, [movementReport]);

  const reorderRiskList: ReorderRiskItem[] = React.useMemo(() => {
    if (!lowStockReport) return [];
    return mapLowStockReport(lowStockReport);
  }, [lowStockReport]);

  const handleInspect = React.useCallback((id: string, type: "velocity" | "reorder") => {
    setSelectedItemId(id);
    setSelectedItemType(type);
  }, []);

  const handleCloseInspect = React.useCallback(() => {
    setSelectedItemId(null);
    setSelectedItemType(null);
  }, []);

  // Secure CSV export handler
  const handleExport = React.useCallback(
    async (format: "csv" | "print") => {
      if (format === "print") {
        window.print();
        return true;
      }

      if (exporting.current) return false;
      exporting.current = true;
      setExportError(null);
      setIsExporting(true);
      try {
        const kind =
          filterState.tab === "velocity"
            ? "movements"
            : filterState.tab === "reorder"
            ? "low_stock"
            : "valuation";

        const res = await exportReportAction({
          kind,
          timeframe: filterState.timeframe,
          search: filterState.searchQuery || undefined,
          category: filterState.category !== "all" && filterState.category !== "" ? filterState.category : undefined,
          startDate: movementReport?.summary.startDate,
          endDate: movementReport?.summary.endDate,
          expectedTimezone: movementReport?.summary.timezone,
        });

        if (!res.ok) {
          setExportError(t.products.persistent.errors[res.code] ?? t.common.error);
          return false;
        }
        if (res.ok) {
          const blob = new Blob([res.data.content], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", res.data.filename);
          try {
            document.body.appendChild(link);
            link.click();
          } finally {
            link.remove();
            URL.revokeObjectURL(url);
          }
          return true;
        }
        return false;
      } catch {
        setExportError(t.common.error);
        return false;
      } finally {
        exporting.current = false;
        setIsExporting(false);
      }
    },
    [filterState, movementReport, t]
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Top Header */}
      <ReportsHeader
        timeframe={filterState.timeframe}
        onTimeframeChange={(tf) => updateFilters({ timeframe: tf })}
        onOpenExportModal={() => { setExportError(null); setIsExportModalOpen(true); }}
      />

      {/* Metric Summary Cards */}
      <ReportsMetricCards
        valuation={valuationReport?.total ?? null}
        lowStock={lowStockReport?.summary ?? null}
        movements={movementReport?.summary ?? null}
        activeTab={filterState.tab}
        onTabChange={(tab) => updateFilters({ tab })}
      />

      {/* Toolbar & Filter Controls */}
      <ReportsToolbar
        activeTab={filterState.tab}
        onTabChange={(tab) => updateFilters({ tab })}
        searchQuery={filterState.searchQuery}
        onSearchChange={(q) => updateFilters({ q })}
        selectedCategory={filterState.category}
        onCategoryChange={(cat) => updateFilters({ category: cat })}
        onResetFilters={() => updateFilters({ q: "", category: "all" })}
        categories={categories}
      />

      {/* Error Banner if any */}
      {failure && (
        <div role="alert" className="border-[3px] border-ink bg-red-100 p-4 font-mono text-xs text-red-800 shadow-hard-sm">
          <p>{t.products.persistent.errors[failure.code] ?? t.common.error}</p>
          <Button type="button" variant="outline" onClick={() => router.refresh()} className="mt-3">{t.reports.retry}</Button>
        </div>
      )}

      {/* Active Tab View */}
      {!failure && detail && filterState.tab === "valuation" && (
        <ValuationReportView summary={valuationSummary} />
      )}

      {!failure && detail && filterState.tab === "velocity" && (
        <MovementVelocityView
          velocityItems={velocityList}
          trends={movementTrends}
          onInspect={handleInspect}
        />
      )}

      {!failure && detail && filterState.tab === "reorder" && (
        <ReorderRiskView
          reorderItems={reorderRiskList}
          onInspect={handleInspect}
        />
      )}

      {!failure && detail && (
        <nav aria-label={t.reports.pagination} className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <span>{t.products.table.page} {detail.page} / {Math.max(1, Math.ceil(detail.count / detail.pageSize))} · {detail.count} {filterState.tab === "valuation" ? t.reports.categories : t.reports.products}. {t.reports.printVisible}</span>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" disabled={detail.page <= 1} onClick={() => updateFilters({ page: String(detail.page - 1) })}>{t.products.table.previous}</Button>
            <Button variant="outline" disabled={detail.page * detail.pageSize >= detail.count} onClick={() => updateFilters({ page: String(detail.page + 1) })}>{t.products.table.next}</Button>
          </div>
        </nav>
      )}

      {/* Export Modal */}
      {isExportModalOpen && <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeTab={filterState.tab}
        onExport={handleExport}
        isExporting={isExporting}
        error={exportError}
      />}

      {/* Detail Slide-Over Inspector */}
      <ReportDetailSheet
        selectedId={selectedItemId}
        selectedType={selectedItemType}
        velocityItems={velocityList}
        reorderItems={reorderRiskList}
        onClose={handleCloseInspect}
      />
    </div>
  );
}
