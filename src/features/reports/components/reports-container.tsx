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

export interface ReportsFilterState {
  tab: ReportTab;
  timeframe: ReportTimeframe;
  searchQuery: string;
  category: string;
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
        totalValuation: 0,
        totalCost: 0,
        grossMargin: 0,
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
        return;
      }

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
          search: filterState.searchQuery || undefined,
          category: filterState.category !== "all" && filterState.category !== "" ? filterState.category : undefined,
          startDate: movementReport?.summary.startDate,
          endDate: movementReport?.summary.endDate,
        });

        if (res.ok) {
          const blob = new Blob([res.data.content], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", res.data.filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } finally {
        setIsExporting(false);
      }
    },
    [filterState, movementReport]
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Top Header */}
      <ReportsHeader
        timeframe={filterState.timeframe}
        onTimeframeChange={(tf) => updateFilters({ timeframe: tf })}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Metric Summary Cards */}
      <ReportsMetricCards
        valuationSummary={valuationSummary}
        reorderRiskList={reorderRiskList}
        velocityList={velocityList}
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
        <div className="border-[3px] border-ink bg-red-100 p-4 font-mono text-xs text-red-800 shadow-hard-sm">
          <strong>Perhatian:</strong> Gagal memuat sebagian data laporan ({failure.code}).
        </div>
      )}

      {/* Active Tab View */}
      {filterState.tab === "valuation" && (
        <ValuationReportView summary={valuationSummary} />
      )}

      {filterState.tab === "velocity" && (
        <MovementVelocityView
          velocityItems={velocityList}
          trends={movementTrends}
          onInspect={handleInspect}
        />
      )}

      {filterState.tab === "reorder" && (
        <ReorderRiskView
          reorderItems={reorderRiskList}
          onInspect={handleInspect}
        />
      )}

      {/* Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeTab={filterState.tab}
        onExport={handleExport}
        isExporting={isExporting}
      />

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
