"use client";

import * as React from "react";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkuBadge } from "@/components/shared/sku-badge";
import { SlidersHorizontal, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdjustmentReason, InventoryItem } from "../types";

export interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetItem: InventoryItem | null;
  allItems: InventoryItem[];
  onAdjustStock: (
    itemId: string,
    newStock: number,
    reason: AdjustmentReason,
    reference: string,
    note?: string
  ) => void;
}

interface FormInnerProps {
  initialItem: InventoryItem | null;
  allItems: InventoryItem[];
  onSubmit: (
    itemId: string,
    newStock: number,
    reason: AdjustmentReason,
    reference: string,
    note?: string
  ) => void;
  onBatal: () => void;
}

function StockAdjustmentForm({
  initialItem,
  allItems,
  onSubmit,
  onCancel,
}: FormInnerProps) {
  const [selectedItemId, setSelectedItemId] = React.useState<string>(
    initialItem ? initialItem.id : allItems[0]?.id || ""
  );
  const activeItem = allItems.find((i) => i.id === selectedItemId) || initialItem;

  const [newStockStr, setNewStockStr] = React.useState<string>(
    activeItem ? activeItem.currentStock.toString() : "0"
  );
  const [reason, setReason] = React.useState<AdjustmentReason>("cycle_count");
  const [reference, setReference] = React.useState<string>("ADJ-AUDIT");
  const [note, setNote] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const currentStock = activeItem ? activeItem.currentStock : 0;
  const newStockNum = newStockStr.trim() ? Number(newStockStr) : NaN;
  const delta = isNaN(newStockNum) ? 0 : newStockNum - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!Number.isSafeInteger(newStockNum) || newStockNum < 0) {
      setError("Masukkan jumlah fisik yang benar (tidak boleh minus).");
      return;
    }

    if (!activeItem) {
      setError("Please select an item.");
      return;
    }

    if (delta === 0) {
      setError("Stok fisik sama dengan sistem. Tidak ada selisih.");
      return;
    }

    if (!reference.trim()) {
      setError("Please specify an adjustment reference code.");
      return;
    }

    try {
      onSubmit(activeItem.id, newStockNum, reason, reference.trim().toUpperCase(), note.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust stock");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody className="space-y-4">
        {/* 1. Item Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="itemSelect" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Pilih Barang
          </Label>
          {initialItem ? (
            <div className="p-3 rounded-none border-[3px] border-ink bg-slate-50/60 dark:bg-slate-900/40 text-xs flex items-center justify-between">
              <div className="flex flex-col gap-1 min-w-0 pr-2">
                <SkuBadge code={initialItem.sku} />
                <span className="font-sans font-medium text-foreground truncate">{initialItem.name}</span>
                <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                  Shelf: {initialItem.locationBin}
                </span>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-foreground shrink-0 text-right">
                {initialItem.currentStock} {initialItem.unit}
                <span className="block text-[10px] font-sans text-muted-foreground font-normal">on hand</span>
              </span>
            </div>
          ) : (
            <select
              id="itemSelect"
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                const nextItem = allItems.find((i) => i.id === e.target.value);
                if (nextItem) setNewStockStr(nextItem.currentStock.toString());
              }}
              className="w-full h-9 rounded-none border-[3px] border-ink bg-background px-3 text-xs font-medium text-foreground focus:border-slate-900 focus:outline-none"
            >
              {allItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} - {item.name} ({item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 2. Current vs New Stock Comparison & Delta */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-none bg-slate-50/60 dark:bg-slate-900/40 border-[3px] border-ink">
          <div>
            <span className="text-[11px] font-mono uppercase text-muted-foreground block">
              Stok Sistem Saat Ini
            </span>
            <span className="font-mono tabular-nums text-lg font-semibold text-foreground">
              {currentStock} <span className="text-xs font-normal text-muted-foreground font-sans">{activeItem?.unit}</span>
            </span>
          </div>

          <div>
            <Label htmlFor="newStock" className="text-[11px] font-mono uppercase text-muted-foreground block">
              Stok Fisik Asli (Real) *
            </Label>
            <Input
              id="newStock"
              type="number"
              min="0"
              value={newStockStr}
              onChange={(e) => setNewStockStr(e.target.value)}
              className="h-8 text-xs font-mono tabular-nums font-semibold bg-background border-ink focus:border-slate-900"
            />
          </div>

          {/* Delta feedback */}
          <div className="col-span-2 pt-2 border-t border-ink flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-muted-foreground font-sans">Selisih (Adjustment):</span>
            <span
              className={cn(
                "font-medium px-2 py-0.5 rounded-none border",
                delta > 0 && "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
                delta < 0 && "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
                delta === 0 && "bg-slate-100 text-slate-700 border-ink dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {delta > 0 ? `+${delta}` : delta} {activeItem?.unit || "units"}
            </span>
          </div>
        </div>

        {/* 3. Reason Code & Reference */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reasonSelect" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Alasan Selisih
            </Label>
            <select
              id="reasonSelect"
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              className="w-full h-9 rounded-none border-[3px] border-ink bg-background px-2.5 text-xs font-medium text-foreground focus:border-slate-900 focus:outline-none"
            >
              <option value="cycle_count">Stok Opname Rutin</option>
              <option value="damaged_goods">Barang Rusak</option>
              <option value="expired">Barang Expired/Basi</option>
              <option value="theft_loss">Hilang / Selisih</option>
              <option value="supplier_return">Retur ke Supplier</option>
              <option value="correction">Koreksi Salah Input</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjReference" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Kode Referensi *
            </Label>
            <Input
              id="adjReference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              className="h-9 text-xs font-mono tabular-nums uppercase border-ink focus:border-slate-900"
            />
          </div>
        </div>

        {/* 4. Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="adjNote" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Catatan Opname
          </Label>
          <Input
            id="adjNote"
            type="text"
            placeholder="e.g. Annual physical count variance in shelf A-02"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 text-xs border-ink focus:border-slate-900"
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-400 font-sans flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </DialogBody>

      {/* Footer */}
      <DialogFooter className="mt-4 pt-3 border-t border-ink">
        <DialogClose
          render={<Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-9 text-xs border-ink hover:border-slate-400" />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          size="sm"
          className="h-9 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Simpan Stok Opname
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  targetItem,
  allItems,
  onAdjustStock,
}: StockAdjustmentModalProps) {
  // Keyed form pattern for React 19 safety
  const formKey = `${targetItem?.id || "general"}-${open}`;

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span>Stok Opname (Penyesuaian)</span>
            </DialogTitle>
            <DialogDescription className="font-mono tabular-nums text-xs uppercase tracking-wider text-muted-foreground">
              Samakan stok fisik asli dengan sistem
            </DialogDescription>
          </DialogHeader>

          {open && (
            <StockAdjustmentForm
              key={formKey}
              initialItem={targetItem}
              allItems={allItems}
              onSubmit={(itemId, newStock, reason, ref, note) => {
                onAdjustStock(itemId, newStock, reason, ref, note);
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
