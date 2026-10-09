"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { SkuBadge } from "@/components/shared/sku-badge";
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
          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>+{Math.abs(mov.quantity)}</span>
          </span>
        );
      case "out":
        return (
          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-medium text-rose-700 dark:text-rose-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>-{Math.abs(mov.quantity)}</span>
          </span>
        );
      case "adjustment":
        return (
          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-medium text-amber-700 dark:text-amber-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{mov.quantity >= 0 ? `+${mov.quantity}` : mov.quantity}</span>
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
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-[3px] border-ink bg-paper font-sans text-[10px] font-bold uppercase tracking-widest text-ink">
              <th className="py-3 px-3.5 sm:px-4 border-r-[2px] border-ink/20">Timestamp</th>
              <th className="py-3 px-3.5 sm:px-4 border-r-[2px] border-ink/20">Delta</th>
              <th className="py-3 px-3.5 sm:px-4 border-r-[2px] border-ink/20">Reference</th>
              <th className="py-3 px-3.5 sm:px-4 min-w-[220px] border-r-[2px] border-ink/20">Product / SKU</th>
              <th className="py-3 px-3.5 sm:px-4 text-center border-r-[2px] border-ink/20">Stock Change</th>
              <th className="py-3 px-3.5 sm:px-4 min-w-[180px] border-r-[2px] border-ink/20">Reason / Notes</th>
              <th className="py-3 px-3.5 sm:px-4 text-right">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y-[2px] divide-ink/20 text-xs">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center border-[3px] border-ink bg-paper text-ink shadow-hard-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="font-sans font-bold uppercase tracking-widest text-ink text-sm">
                      No stock movement audit records found
                    </p>
                    <p className="font-mono uppercase tracking-widest text-[10px] text-ink/60 max-w-sm">
                      Try resetting your search query or changing your movement type filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ink border-[3px] border-ink bg-white px-3 py-1.5 shadow-hard-sm press"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-paper transition-colors bg-white">
                  {/* 1. Timestamp */}
                  <td className="py-2.5 px-3.5 sm:px-4 font-mono tabular-nums text-[11px] text-ink/60 whitespace-nowrap border-r-[2px] border-ink/20 uppercase tracking-widest">
                    {mov.timestamp}
                  </td>

                  {/* 2. Type Badge */}
                  <td className="py-2.5 px-3.5 sm:px-4 whitespace-nowrap border-r-[2px] border-ink/20">
                    {getMovementTypeBadge(mov)}
                  </td>

                  {/* 3. Reference Code */}
                  <td className="py-2.5 px-3.5 sm:px-4 whitespace-nowrap border-r-[2px] border-ink/20">
                    <SkuBadge code={mov.reference} />
                  </td>

                  {/* 4. Product & SKU */}
                  <td className="py-2.5 px-3.5 sm:px-4 border-r-[2px] border-ink/20">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-bold text-ink uppercase truncate">
                        {mov.itemName}
                      </span>
                      <span className="font-mono tabular-nums text-[10px] uppercase tracking-widest text-ink/60 mt-1">
                        <span className="bg-paper border border-ink/20 px-1 font-bold text-ink mr-1">{mov.sku}</span>
                      </span>
                    </div>
                  </td>

                  {/* 6. Stock Change (Prev -> New) */}
                  <td className="py-2.5 px-3.5 sm:px-4 text-center font-mono tabular-nums border-r-[2px] border-ink/20">
                    <div className="inline-flex items-center gap-1.5 text-xs bg-paper border border-ink/20 px-2 py-0.5">
                      <span className="text-ink/60">{mov.previousStock}</span>
                      <span className="text-ink/40">→</span>
                      <span className="font-bold text-ink">{mov.newStock}</span>
                    </div>
                  </td>

                  {/* 7. Reason & Notes */}
                  <td className="py-2.5 px-3.5 sm:px-4 border-r-[2px] border-ink/20">
                    <div className="flex flex-col gap-0.5 max-w-[240px]">
                      {mov.reason && (
                        <span className="inline-block self-start font-mono text-[10px] font-bold uppercase tracking-widest text-ink bg-acid/10 border border-ink px-1 mb-1">
                          {getReasonLabel(mov.reason)}
                        </span>
                      )}
                      {mov.note ? (
                        <span className="text-[10px] text-ink/60 font-mono uppercase tracking-widest truncate mt-0.5" title={mov.note}>
                          {mov.note}
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink/40 italic font-mono uppercase tracking-widest">No notes</span>
                      )}
                    </div>
                  </td>

                  {/* 8. Performed By */}
                  <td className="py-2.5 px-3.5 sm:px-4 text-right font-mono text-[10px] uppercase tracking-widest text-ink/80 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex h-5 w-5 items-center justify-center bg-ink text-white font-bold text-[10px]">
                        {mov.performedBy.charAt(0)}
                      </div>
                      <span className="font-bold">{mov.performedBy}</span>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t-[3px] border-ink px-4 py-3 bg-paper">
          <div className="font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest text-ink/60">
            Showing <span className="font-bold text-ink bg-white border border-ink/20 px-1 mx-0.5">{startIndex}</span> to{" "}
            <span className="font-bold text-ink bg-white border border-ink/20 px-1 mx-0.5">{endIndex}</span> of{" "}
            <span className="font-bold text-ink">{totalCount}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(filterState.page - 1)}
              disabled={filterState.page <= 1}
              className="flex items-center justify-center h-8 gap-1 px-2.5 text-[10px] font-bold uppercase tracking-widest border-[3px] border-ink bg-white text-ink disabled:opacity-40 shadow-hard-sm press"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>

            <span className="font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest text-ink/60 px-2">
              Page <span className="font-bold text-ink">{filterState.page}</span> of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(filterState.page + 1)}
              disabled={filterState.page >= totalPages}
              className="flex items-center justify-center h-8 gap-1 px-2.5 text-[10px] font-bold uppercase tracking-widest border-[3px] border-ink bg-white text-ink disabled:opacity-40 shadow-hard-sm press"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
