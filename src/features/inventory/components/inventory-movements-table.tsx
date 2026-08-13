"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InventoryFilterState, StockMovement } from "../types";

interface InventoryMovementsTableProps {
  movements: StockMovement[];
  totalCount: number;
  filterState: InventoryFilterState;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export function InventoryMovementsTable({
  movements,
  totalCount,
  filterState,
  hasActiveFilters,
  onPageChange,
  onResetFilters,
}: InventoryMovementsTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / filterState.pageSize));
  const startIndex = (filterState.page - 1) * filterState.pageSize + 1;
  const endIndex = Math.min(filterState.page * filterState.pageSize, totalCount);

  const getMovementTypeBadge = (mov: StockMovement) => {
    switch (mov.type) {
      case "in":
        return (
          <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            <ArrowDownRight className="h-3 w-3 text-emerald-600" />
            STOCK IN (+{Math.abs(mov.quantity)})
          </span>
        );
      case "out":
        return (
          <span className="inline-flex items-center gap-1 rounded-sm border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-800">
            <ArrowUpRight className="h-3 w-3 text-rose-600" />
            STOCK OUT (-{Math.abs(mov.quantity)})
          </span>
        );
      case "adjustment":
        return (
          <span className="inline-flex items-center gap-1 rounded-sm border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
            <SlidersHorizontal className="h-3 w-3 text-amber-600" />
            ADJUSTMENT ({mov.quantity >= 0 ? `+${mov.quantity}` : mov.quantity})
          </span>
        );
      case "transfer":
        return (
          <span className="inline-flex items-center gap-1 rounded-sm border border-purple-300 bg-purple-50 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-800">
            <ArrowRightLeft className="h-3 w-3 text-purple-600" />
            TRANSFER
          </span>
        );
    }
  };

  const getReasonLabel = (reason?: string) => {
    if (!reason) return null;
    const map: Record<string, string> = {
      cycle_count: "Cycle Count Audit",
      damaged_goods: "Damaged Goods",
      expired: "Expired / Obsolete",
      theft_loss: "Discrepancy / Loss",
      supplier_return: "Supplier Return",
      correction: "Correction Entry",
    };
    return map[reason] || reason;
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-white shadow-none overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-slate-50/80 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4 min-w-[220px]">Product / SKU</th>
              <th className="py-3 px-4">Warehouse</th>
              <th className="py-3 px-4 text-center">Stock Change</th>
              <th className="py-3 px-4 min-w-[180px]">Reason / Notes</th>
              <th className="py-3 px-4 text-right">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="font-heading font-semibold text-foreground text-sm">
                      No stock movement audit records found
                    </p>
                    <p className="font-sans text-xs text-muted-foreground max-w-sm">
                      Try resetting your search query or changing your movement type filters.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetFilters}
                        className="mt-2 text-xs border-slate-300"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* 1. Timestamp */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {mov.timestamp}
                  </td>

                  {/* 2. Type Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">{getMovementTypeBadge(mov)}</td>

                  {/* 3. Reference Code */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-foreground whitespace-nowrap">
                    <span className="inline-block px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-800 border border-slate-300 text-[11px]">
                      {mov.reference}
                    </span>
                  </td>

                  {/* 4. Product & SKU */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-heading font-semibold text-foreground">
                        {mov.itemName}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        SKU: {mov.sku}
                      </span>
                    </div>
                  </td>

                  {/* 5. Warehouse */}
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {mov.warehouse}
                  </td>

                  {/* 6. Stock Change (Prev -> New) */}
                  <td className="py-3.5 px-4 text-center font-mono">
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">{mov.previousStock}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-foreground">{mov.newStock}</span>
                    </div>
                  </td>

                  {/* 7. Reason & Notes */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5 max-w-[240px]">
                      {mov.reason && (
                        <span className="inline-block self-start rounded-sm bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-700 border border-slate-200">
                          {getReasonLabel(mov.reason)}
                        </span>
                      )}
                      {mov.note ? (
                        <span className="text-[11px] text-slate-600 truncate" title={mov.note}>
                          {mov.note}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No notes</span>
                      )}
                    </div>
                  </td>

                  {/* 8. Performed By */}
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                        {mov.performedBy.charAt(0)}
                      </div>
                      <span>{mov.performedBy}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border px-4 py-3 bg-slate-50/50">
          <div className="font-mono text-xs text-muted-foreground">
            Showing <span className="font-bold text-foreground">{startIndex}</span> to{" "}
            <span className="font-bold text-foreground">{endIndex}</span> of{" "}
            <span className="font-bold text-foreground">{totalCount}</span> audit records
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(filterState.page - 1)}
              disabled={filterState.page <= 1}
              className="h-8 gap-1 px-2.5 text-xs border-slate-300 font-mono disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </Button>

            <span className="font-mono text-xs text-slate-700 px-1">
              Page {filterState.page} of {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(filterState.page + 1)}
              disabled={filterState.page >= totalPages}
              className="h-8 gap-1 px-2.5 text-xs border-slate-300 font-mono disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
