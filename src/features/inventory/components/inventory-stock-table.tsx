"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { InventoryFilterState, InventoryItem } from "../types";

interface InventoryStockTableProps {
  items: InventoryItem[];
  totalCount: number;
  filterState: InventoryFilterState;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onSelectItem: (item: InventoryItem) => void;
  onAdjustItem: (item: InventoryItem) => void;
  onQuickMove: (item: InventoryItem, type: "in" | "out") => void;
}

export function InventoryStockTable({
  items,
  totalCount,
  filterState,
  hasActiveFilters,
  onPageChange,
  onResetFilters,
  onSelectItem,
  onAdjustItem,
  onQuickMove,
}: InventoryStockTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / filterState.pageSize));
  const startIndex = (filterState.page - 1) * filterState.pageSize + 1;
  const endIndex = Math.min(filterState.page * filterState.pageSize, totalCount);

  const getStatusBadge = (item: InventoryItem) => {
    switch (item.status) {
      case "in_stock":
      case "overstocked":
        return (
          <span className="bg-acid border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Optimal
          </span>
        );
      case "low_stock":
        return (
          <span className="bg-orange-400 border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Low Stock
          </span>
        );
      case "out_of_stock":
        return (
          <span className="bg-ink text-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Critical
          </span>
        );
      default:
        return (
          <span className="bg-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            {item.status}
          </span>
        );
    }
  };

  const getStockValueColor = (item: InventoryItem) => {
    switch (item.status) {
      case "out_of_stock":
        return "text-red-600";
      case "low_stock":
        return "text-orange-700";
      default:
        return "text-ink";
    }
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left">
          <thead className="bg-paper border-b-[3px] border-ink font-mono text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-5 py-4">SKU</th>
              <th className="px-5 py-4">Product Name</th>
              <th className="px-5 py-4">Warehouse</th>
              <th className="px-5 py-4 text-right">Current Stock</th>
              <th className="px-5 py-4 text-right">Min Level</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-[2px] divide-black/10">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="font-display font-bold uppercase text-ink text-lg mt-4">
                      No matching items
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 max-w-sm">
                      Try adjusting your search or filters
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={onResetFilters}
                        className="mt-4 press bg-acid border-[3px] border-ink shadow-hard-sm px-4 py-2 font-display font-bold uppercase text-xs"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-acid/10 cursor-pointer"
                  onClick={() => onSelectItem(item)}
                >
                  <td className="px-5 py-4 font-mono text-xs font-bold text-ink">
                    {item.sku}
                  </td>
                  <td className="px-5 py-4 text-ink">
                    <p className="font-display font-bold uppercase text-sm">
                      {item.name}
                    </p>
                    <p className="font-mono text-[9px] opacity-45">
                      {item.category}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ink">
                    {item.warehouse}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-4 text-right font-display font-[900]",
                      getStockValueColor(item)
                    )}
                  >
                    {item.currentStock.toLocaleString("id-ID")}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-ink">
                    {item.minStock}
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(item)}</td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onAdjustItem(item)}
                        title="Adjust Stock"
                        className="press w-8 h-8 bg-white border-2 border-ink shadow-hard-sm flex items-center justify-center text-ink"
                      >
                        <Icon icon="ph:pencil-simple-bold" className="text-lg" />
                      </button>
                      <button
                        onClick={() => onSelectItem(item)}
                        title="View Details"
                        className="press w-8 h-8 bg-white border-2 border-ink shadow-hard-sm flex items-center justify-center text-ink"
                      >
                        <Icon icon="ph:eye-bold" className="text-lg" />
                      </button>
                      <button
                        title="Delete"
                        className="press w-8 h-8 bg-ink text-acid border-2 border-ink shadow-hard-sm flex items-center justify-center"
                      >
                        <Icon icon="ph:trash-bold" className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
        <div className="border-t-[3px] border-ink bg-paper p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 text-ink">
            Showing {startIndex}-{endIndex} of {totalCount.toLocaleString("id-ID")} items
          </span>
          <div className="flex items-center gap-2 text-ink">
            <button
              onClick={() => onPageChange(filterState.page - 1)}
              disabled={filterState.page <= 1}
              className="press px-3 py-2 bg-white border-[3px] border-ink shadow-hard-sm font-mono text-[10px] uppercase font-bold disabled:opacity-50"
            >
              Previous
            </button>

            {/* Simulated Pagination Numbers for visual match with draft */}
            {filterState.page > 1 && (
              <button
                onClick={() => onPageChange(1)}
                className={cn(
                  "px-3 py-2 border-[3px] border-ink font-mono text-[10px] font-bold",
                  1 === filterState.page ? "bg-ink text-paper" : "press bg-white shadow-hard-sm"
                )}
              >
                1
              </button>
            )}

            {filterState.page > 2 && (
              <span className="font-mono text-xs">...</span>
            )}

            <button
              className={cn(
                "px-3 py-2 border-[3px] border-ink font-mono text-[10px] font-bold",
                "bg-ink text-paper"
              )}
            >
              {filterState.page}
            </button>

            {filterState.page < totalPages - 1 && (
              <span className="font-mono text-xs">...</span>
            )}

            {filterState.page < totalPages && (
              <button
                onClick={() => onPageChange(totalPages)}
                className={cn(
                  "px-3 py-2 border-[3px] border-ink font-mono text-[10px] font-bold press bg-white shadow-hard-sm"
                )}
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={() => onPageChange(filterState.page + 1)}
              disabled={filterState.page >= totalPages}
              className="press px-3 py-2 bg-white border-[3px] border-ink shadow-hard-sm font-mono text-[10px] uppercase font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}