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
import { Button } from "@/components/ui/button";
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

      {/* Slide-over Panel: 1px hairline separation, soft structural elevation */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-lg animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b border-border p-4 sm:p-5 flex items-start justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex flex-col gap-1 pr-4 min-w-0">
            <div className="flex items-center gap-2">
              <SkuBadge code={item.sku} />
              <span className="font-mono tabular-nums text-[11px] uppercase tracking-wider text-muted-foreground">
                {item.category}
              </span>
            </div>
            <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground mt-1 truncate">
              {item.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Quick Actions Panel */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onQuickMove(item, "in")}
              className="flex-1 h-9 gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Stock In</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onQuickMove(item, "out")}
              disabled={item.currentStock === 0}
              className="flex-1 h-9 gap-1.5 border-rose-300 text-rose-800 bg-rose-50 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60 text-xs font-medium disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
              <span>Stock Out</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAdjustStock(item)}
              className="h-9 gap-1.5 border-border hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-800 text-xs font-medium text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Adjust</span>
            </Button>
          </div>

          {/* Live Stock Health Card */}
          <div className="rounded-md border border-border bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stock Health Gauge
              </span>
              <span className="font-mono tabular-nums text-xs font-semibold text-foreground">
                {stockRatio}% of Max Cap
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  item.status === "out_of_stock" && "bg-rose-600",
                  item.status === "low_stock" && "bg-amber-600",
                  item.status === "in_stock" && "bg-emerald-600",
                  item.status === "overstocked" && "bg-blue-600"
                )}
                style={{ width: `${Math.max(4, stockRatio)}%` }}
              />
            </div>

            {/* Stock Metric Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              <div className="text-center p-2 rounded-md bg-card border border-border">
                <div className="font-sans text-[10px] text-muted-foreground uppercase">On Hand</div>
                <div className="font-mono tabular-nums text-base font-semibold text-foreground">
                  {item.currentStock}
                </div>
                <div className="text-[10px] text-muted-foreground font-sans">{item.unit}</div>
              </div>

              <div className="text-center p-2 rounded-md bg-card border border-border">
                <div className="font-sans text-[10px] text-muted-foreground uppercase">Reserved</div>
                <div className="font-mono tabular-nums text-base font-semibold text-amber-700 dark:text-amber-400">
                  {item.reservedStock}
                </div>
                <div className="text-[10px] text-muted-foreground font-sans">{item.unit}</div>
              </div>

              <div className="text-center p-2 rounded-md bg-card border border-border">
                <div className="font-sans text-[10px] text-muted-foreground uppercase">Available</div>
                <div
                  className={cn(
                    "font-mono tabular-nums text-base font-semibold",
                    item.availableStock === 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"
                  )}
                >
                  {item.availableStock}
                </div>
                <div className="text-[10px] text-muted-foreground font-sans">{item.unit}</div>
              </div>
            </div>
          </div>

          {/* Warehouse & Location Specs */}
          <div className="rounded-md border border-border bg-card p-4 space-y-3">
            <h3 className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Warehouse Location Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Assigned Warehouse</span>
                <span className="font-medium text-foreground">{item.warehouse}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Storage Bin</span>
                <span className="font-mono tabular-nums font-medium text-foreground">
                  {item.locationBin}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Minimum Reorder Threshold</span>
                <span className="font-mono tabular-nums font-medium text-amber-700 dark:text-amber-400">{item.minStock} {item.unit}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Maximum Storage Capacity</span>
                <span className="font-mono tabular-nums font-medium text-foreground">{item.maxStock} {item.unit}</span>
              </div>
            </div>
          </div>

          {/* Valuation Card */}
          <div className="rounded-md border border-border bg-card p-4 space-y-3">
            <h3 className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Valuation & Unit Economics</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Unit Cost</span>
                <span className="font-mono tabular-nums font-medium text-foreground">{formatCurrency(item.unitCost)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Total Stock Valuation</span>
                <span className="font-mono tabular-nums font-medium text-foreground">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Item Specific Movement Logs Timeline */}
          <div className="space-y-3">
            <h3 className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Recent Movement Timeline</span>
            </h3>

            {item.movementLogs && item.movementLogs.length > 0 ? (
              <div className="divide-y divide-border border border-border rounded-md bg-card overflow-hidden">
                {item.movementLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono tabular-nums font-semibold text-[11px] text-foreground">
                        {log.reference}
                      </span>
                      <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                        {log.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 font-mono tabular-nums text-[11px]">
                        {log.type === "in" && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                            <ArrowDownRight className="h-3 w-3" /> +{Math.abs(log.quantity)} {item.unit}
                          </span>
                        )}
                        {log.type === "out" && (
                          <span className="text-rose-700 dark:text-rose-400 font-medium flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3" /> -{Math.abs(log.quantity)} {item.unit}
                          </span>
                        )}
                        {log.type === "adjustment" && (
                          <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-0.5">
                            <SlidersHorizontal className="h-3 w-3" /> {log.quantity >= 0 ? `+${log.quantity}` : log.quantity} {item.unit}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        by {log.performedBy}
                      </span>
                    </div>
                    {log.note && (
                      <p className="text-[11px] text-muted-foreground bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-sm border border-border mt-1">
                        {log.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-md bg-slate-50/50 dark:bg-slate-900/20">
                <p className="text-xs text-muted-foreground font-sans">
                  No movement logs recorded yet for this item.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3.5 sm:p-4 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
          <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
            Last updated: {item.lastMovementAt}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 text-xs border-border hover:border-slate-400"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}