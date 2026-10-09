"use client";

import * as React from "react";
import {
  X,
  MapPin,
  SlidersHorizontal,
  Plus,
  Minus,
  History,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { SkuBadge } from "@/components/shared/sku-badge";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "../types";

interface InventoryDetailSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onAdjustStock: (item: InventoryItem) => void;
  onQuickMove: (item: InventoryItem, type: "in" | "out") => void;
}

export function InventoryDetailSheet({
  item,
  open,
  onClose,
  onAdjustStock,
  onQuickMove,
}: InventoryDetailSheetProps) {
  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !item) return null;

  const stockRatio = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));
  const totalValue = item.currentStock * item.unitCost;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop: calm flat semi-transparent overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Panel: Neobrutalism thick border shadow */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l-[3px] border-ink bg-white shadow-[-8px_0_0_0_#000] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b-[3px] border-ink p-4 sm:p-5 flex items-start justify-between bg-paper">
          <div className="flex flex-col gap-1 pr-4 min-w-0">
            <div className="flex items-center gap-2">
              <SkuBadge code={item.sku} />
              <span className="font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest text-ink/60 bg-white border border-ink/20 px-1">
                {item.category}
              </span>
            </div>
            <h2 className="font-sans text-lg font-bold tracking-tight text-ink mt-2 truncate uppercase">
              {item.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink hover:bg-ink/10 transition-colors cursor-pointer shrink-0 border-[3px] border-transparent hover:border-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Quick Actions Panel */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickMove(item, "in")}
              className="flex-1 flex justify-center items-center h-10 gap-1.5 border-[3px] border-ink text-emerald-800 bg-emerald-100 hover:bg-emerald-200 text-[10px] font-bold uppercase tracking-widest shadow-hard-sm press"
            >
              <Plus className="h-4 w-4" />
              <span>Stock In</span>
            </button>

            <button
              type="button"
              onClick={() => onQuickMove(item, "out")}
              disabled={item.currentStock === 0}
              className="flex-1 flex justify-center items-center h-10 gap-1.5 border-[3px] border-ink text-rose-800 bg-rose-100 hover:bg-rose-200 text-[10px] font-bold uppercase tracking-widest shadow-hard-sm press disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
              <span>Stock Out</span>
            </button>

            <button
              type="button"
              onClick={() => onAdjustStock(item)}
              className="flex-1 flex justify-center items-center h-10 gap-1.5 border-[3px] border-ink bg-white text-ink hover:bg-paper text-[10px] font-bold uppercase tracking-widest shadow-hard-sm press"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Adjust</span>
            </button>
          </div>

          {/* Live Stock Health Card */}
          <div className="border-[3px] border-ink bg-paper p-4 space-y-3 shadow-hard-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink/80">
                Stock Health Gauge
              </span>
              <span className="font-mono tabular-nums text-[10px] font-bold text-ink bg-white border border-ink/20 px-1">
                {stockRatio}% of Max Cap
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white border border-ink h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 border-r border-ink",
                  item.status === "out_of_stock" && "bg-rose-500",
                  item.status === "low_stock" && "bg-amber-500",
                  item.status === "in_stock" && "bg-emerald-500",
                  item.status === "overstocked" && "bg-blue-500"
                )}
                style={{ width: `${Math.max(4, stockRatio)}%` }}
              />
            </div>

            {/* Stock Metric Grid */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t-[2px] border-ink/20">
              <div className="text-center p-2 bg-white border-[3px] border-ink shadow-neo-sm">
                <div className="font-sans text-[10px] font-bold text-ink uppercase tracking-widest">On Hand</div>
                <div className="font-mono tabular-nums text-lg font-bold text-ink my-1">
                  {item.currentStock}
                </div>
                <div className="text-[10px] font-bold text-ink/60 font-mono uppercase tracking-widest">{item.unit}</div>
              </div>

              <div className="text-center p-2 bg-white border-[3px] border-ink shadow-neo-sm">
                <div className="font-sans text-[10px] font-bold text-ink uppercase tracking-widest">Reserved</div>
                <div className="font-mono tabular-nums text-lg font-bold text-amber-600 my-1">
                  {item.reservedStock}
                </div>
                <div className="text-[10px] font-bold text-ink/60 font-mono uppercase tracking-widest">{item.unit}</div>
              </div>

              <div className="text-center p-2 bg-white border-[3px] border-ink shadow-neo-sm">
                <div className="font-sans text-[10px] font-bold text-ink uppercase tracking-widest">Available</div>
                <div
                  className={cn(
                    "font-mono tabular-nums text-lg font-bold my-1",
                    item.availableStock === 0 ? "text-rose-600" : "text-emerald-600"
                  )}
                >
                  {item.availableStock}
                </div>
                <div className="text-[10px] font-bold text-ink/60 font-mono uppercase tracking-widest">{item.unit}</div>
              </div>
            </div>
          </div>

          {/* Warehouse & Location Specs */}
          <div className="border-[3px] border-ink bg-white p-4 space-y-4 shadow-hard-sm">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ink bg-acid/10 p-0.5 border border-ink" />
              <span>Shelf & Stock Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">Storage Bin</span>
                <span className="font-mono tabular-nums font-bold text-ink bg-paper px-1 border border-ink/20">
                  {item.locationBin}
                </span>
              </div>
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">Min Reorder Threshold</span>
                <span className="font-mono tabular-nums font-bold text-amber-600">{item.minStock} {item.unit}</span>
              </div>
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">Max Storage Capacity</span>
                <span className="font-mono tabular-nums font-bold text-ink">{item.maxStock} {item.unit}</span>
              </div>
            </div>
          </div>

          {/* Valuation Card */}
          <div className="border-[3px] border-ink bg-white p-4 space-y-4 shadow-hard-sm">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-ink bg-emerald-100 p-0.5 border border-ink" />
              <span>Valuation & Unit Economics</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">Unit Cost</span>
                <span className="font-mono tabular-nums font-bold text-ink bg-paper px-1 border border-ink/20">{formatCurrency(item.unitCost)}</span>
              </div>
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">Total Stock Valuation</span>
                <span className="font-mono tabular-nums font-bold text-ink bg-paper px-1 border border-ink/20">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Item Specific Movement Logs Timeline */}
          <div className="space-y-3">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <History className="h-4 w-4 text-ink bg-blue-100 p-0.5 border border-ink" />
              <span>Recent Movement Timeline</span>
            </h3>

            {item.movementLogs && item.movementLogs.length > 0 ? (
              <div className="divide-y-[2px] divide-ink/20 border-[3px] border-ink bg-white overflow-hidden shadow-hard-sm">
                {item.movementLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex flex-col gap-2 hover:bg-paper transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono tabular-nums font-bold text-[10px] uppercase text-ink bg-acid/10 px-1 border border-ink/20">
                        {log.reference}
                      </span>
                      <span className="font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest text-ink/60">
                        {log.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 font-mono tabular-nums text-[11px]">
                        {log.type === "in" && (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <ArrowDownRight className="h-3 w-3" /> +{Math.abs(log.quantity)} {item.unit}
                          </span>
                        )}
                        {log.type === "out" && (
                          <span className="text-rose-700 font-bold flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3" /> -{Math.abs(log.quantity)} {item.unit}
                          </span>
                        )}
                        {log.type === "adjustment" && (
                          <span className="text-amber-700 font-bold flex items-center gap-0.5">
                            <SlidersHorizontal className="h-3 w-3" /> {log.quantity >= 0 ? `+${log.quantity}` : log.quantity} {item.unit}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink/80 font-mono">
                        by {log.performedBy}
                      </span>
                    </div>
                    {log.note && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-ink/60 bg-paper p-1.5 border border-ink/20 mt-1">
                        {log.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-[3px] border-dashed border-ink/40 bg-paper">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/60 font-mono">
                  No movement logs recorded yet for this item.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-[3px] border-ink p-3.5 sm:p-4 bg-paper flex items-center justify-between">
          <span className="font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest text-ink/60">
            Last updated: {item.lastMovementAt}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-ink bg-white border-[3px] border-ink shadow-hard-sm press"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}