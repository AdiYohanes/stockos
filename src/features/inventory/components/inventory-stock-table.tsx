"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  PackageSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (item: InventoryItem) => {
    switch (item.status) {
      case "in_stock":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            IN STOCK
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            LOW STOCK
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-800">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            OUT OF STOCK
          </span>
        );
      case "overstocked":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-blue-300 bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-800">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            OVERSTOCKED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-white shadow-none overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-slate-50/80 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4">SKU / Code</th>
              <th className="py-3 px-4 min-w-[200px]">Product & Location</th>
              <th className="py-3 px-4">Warehouse</th>
              <th className="py-3 px-4 min-w-[160px]">Stock Health</th>
              <th className="py-3 px-4 text-right">On Hand</th>
              <th className="py-3 px-4 text-right">Available</th>
              <th className="py-3 px-4 text-right">Valuation</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <PackageSearch className="h-5 w-5" />
                    </div>
                    <p className="font-heading font-semibold text-foreground text-sm">
                      No matching inventory items found
                    </p>
                    <p className="font-sans text-xs text-muted-foreground max-w-sm">
                      Try adjusting your search query, status filters, or warehouse selection.
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
              items.map((item) => {
                const stockRatio = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));
                const totalValue = item.currentStock * item.unitCost;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectItem(item)}
                  >
                    {/* 1. SKU */}
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      <span className="inline-block px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-800 border border-slate-300 text-[11px] group-hover:border-black transition-colors">
                        {item.sku}
                      </span>
                    </td>

                    {/* 2. Name & Bin Tag */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-heading font-semibold text-foreground group-hover:text-[#543afd] transition-colors">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-1 py-0.2 rounded-sm border border-slate-200">
                            <MapPin className="h-2.5 w-2.5" />
                            {item.locationBin}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Warehouse */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {item.warehouse}
                    </td>

                    {/* 4. Stock Health Gauge */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(item)}
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Min: {item.minStock}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              item.status === "out_of_stock" && "bg-rose-500",
                              item.status === "low_stock" && "bg-amber-500",
                              item.status === "in_stock" && "bg-emerald-500",
                              item.status === "overstocked" && "bg-blue-500"
                            )}
                            style={{ width: `${Math.max(4, stockRatio)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 5. On Hand */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-foreground">
                        {item.currentStock.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-sans">{item.unit}</div>
                    </td>

                    {/* 6. Available */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className={cn("font-bold", item.availableStock === 0 ? "text-rose-600" : "text-emerald-700")}>
                        {item.availableStock.toLocaleString("id-ID")}
                      </div>
                      {item.reservedStock > 0 && (
                        <div className="text-[10px] text-amber-600 font-mono">
                          ({item.reservedStock} resv)
                        </div>
                      )}
                    </td>

                    {/* 7. Valuation */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(totalValue)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        @{formatCurrency(item.unitCost)}
                      </div>
                    </td>

                    {/* 8. Contextual Actions */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {/* Quick Stock In */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickMove(item, "in")}
                          title="Stock In (+)"
                          className="h-7 w-7 p-0 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>

                        {/* Quick Stock Out */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickMove(item, "out")}
                          disabled={item.currentStock === 0}
                          title="Stock Out (-)"
                          className="h-7 w-7 p-0 text-rose-700 hover:bg-rose-50 hover:text-rose-800 disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>

                        {/* Adjust Stock */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onAdjustItem(item)}
                          title="Adjust Stock"
                          className="h-7 w-7 p-0 text-slate-700 hover:bg-slate-100 hover:text-black"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </Button>

                        {/* Inspect Details */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectItem(item)}
                          title="View Details"
                          className="h-7 w-7 p-0 text-slate-500 hover:bg-slate-100 hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
            <span className="font-bold text-foreground">{totalCount}</span> items
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
