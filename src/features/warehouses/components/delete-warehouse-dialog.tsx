"use client";

import * as React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WarehouseItem } from "../types";

interface DeleteWarehouseDialogProps {
  warehouse: WarehouseItem | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function DeleteWarehouseDialog({
  warehouse,
  open,
  onClose,
  onConfirm,
}: DeleteWarehouseDialogProps) {
  if (!open || !warehouse) return null;

  const hasActiveStock = warehouse.usedCapacityUnits > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-lg border-[1.5px] border-black bg-white shadow-neo overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-red-50/50 px-5 py-4">
          <div className="flex items-center gap-2.5 text-red-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600 text-white border border-black shadow-neo-sm">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                Delete Warehouse Hub
              </h2>
              <span className="font-mono text-[11px] text-red-700 font-semibold uppercase">
                Permanent Action
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 text-xs">
          <p className="text-slate-700">
            Are you sure you want to remove{" "}
            <strong className="text-foreground">{warehouse.name}</strong> (
            <code className="font-mono font-bold">{warehouse.code}</code>)?
          </p>

          {hasActiveStock && (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <strong className="font-bold">Active Inventory Warning:</strong>
                <p className="mt-0.5 text-[11px]">
                  This facility currently holds{" "}
                  <strong>{warehouse.usedCapacityUnits.toLocaleString("id-ID")} units</strong> across{" "}
                  <strong>{warehouse.totalSkusCount} SKUs</strong>. Please ensure all inventory is transferred to another facility before deleting.
                </p>
              </div>
            </div>
          )}

          <p className="text-muted-foreground text-[11px]">
            This action will detach associated storage zones and archive the facility from active dashboard views.
          </p>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border bg-slate-50 px-5 py-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 border-slate-300 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onConfirm(warehouse.id)}
            className="h-9 bg-red-600 hover:bg-red-700 text-white border border-black shadow-neo-sm font-semibold text-xs active:translate-x-0.5 active:translate-y-0.5 transition-all gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Facility</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
