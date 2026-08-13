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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="border-b border-border p-5 flex items-start justify-between bg-slate-50/50">
            <div className="flex flex-col gap-1 pr-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-sm bg-black text-white border border-black shadow-neo-sm">
                  {item.sku}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.category}
                </span>
              </div>
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground mt-1">
                {item.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Quick Actions Panel */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onQuickMove(item, "in")}
                className="flex-1 gap-1.5 border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-mono text-xs font-semibold"
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
                className="flex-1 gap-1.5 border border-rose-300 text-rose-800 bg-rose-50 hover:bg-rose-100 font-mono text-xs font-semibold disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
                <span>Stock Out</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAdjustStock(item)}
                className="gap-1.5 border-[1.5px] border-black bg-white text-black font-semibold text-xs shadow-neo-sm hover:bg-slate-50"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Adjust</span>
              </Button>
            </div>

            {/* Live Stock Health Card */}
            <div className="rounded-lg border border-border bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stock Health Gauge
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {stockRatio}% of Max Cap
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
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

              {/* Stock Metric Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <div className="text-center p-2 rounded bg-white border border-slate-200">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase">On Hand</div>
                  <div className="font-mono text-base font-bold text-foreground">
                    {item.currentStock}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-sans">{item.unit}</div>
                </div>

                <div className="text-center p-2 rounded bg-white border border-slate-200">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase">Reserved</div>
                  <div className="font-mono text-base font-bold text-amber-600">
                    {item.reservedStock}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-sans">{item.unit}</div>
                </div>

                <div className="text-center p-2 rounded bg-white border border-slate-200">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase">Available</div>
                  <div
                    className={cn(
                      "font-mono text-base font-bold",
                      item.availableStock === 0 ? "text-rose-600" : "text-emerald-700"
                    )}
                  >
                    {item.availableStock}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-sans">{item.unit}</div>
                </div>
              </div>
            </div>

            {/* Warehouse & Location Specs */}
            <div className="rounded-lg border border-border bg-white p-4 space-y-3">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>Warehouse Location Details</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Assigned Warehouse</span>
                  <span className="font-medium text-foreground">{item.warehouse}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Storage Bin</span>
                  <span className="font-mono font-bold text-foreground bg-slate-100 px-1.5 py-0.5 rounded-sm border border-slate-300">
                    {item.locationBin}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Minimum Reorder Threshold</span>
                  <span className="font-mono font-semibold text-amber-700">{item.minStock} {item.unit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Maximum Storage Capacity</span>
                  <span className="font-mono font-semibold text-foreground">{item.maxStock} {item.unit}</span>
                </div>
              </div>
            </div>

            {/* Valuation Card */}
            <div className="rounded-lg border border-border bg-white p-4 space-y-3">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Valuation & Unit Economics</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Unit Cost</span>
                  <span className="font-mono font-bold text-foreground">{formatCurrency(item.unitCost)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Stock Valuation</span>
                  <span className="font-mono font-bold text-[#543afd]">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Item Specific Movement Logs Timeline */}
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                <span>Recent Movement Timeline</span>
              </h3>

              {item.movementLogs && item.movementLogs.length > 0 ? (
                <div className="divide-y divide-border border border-border rounded-lg bg-white overflow-hidden">
                  {item.movementLogs.map((log) => (
                    <div key={log.id} className="p-3 text-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-foreground">
                          {log.reference}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {log.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
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
                            <span className="text-amber-800 font-bold flex items-center gap-0.5">
                              <SlidersHorizontal className="h-3 w-3" /> {log.quantity >= 0 ? `+${log.quantity}` : log.quantity} {item.unit}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          by {log.performedBy}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-sm border border-slate-100 mt-1">
                          {log.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/50">
                  <p className="text-xs text-muted-foreground font-sans">
                    No movement logs recorded yet for this item.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 bg-slate-50/50 flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted-foreground">
              Last updated: {item.lastMovementAt}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-slate-300"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
