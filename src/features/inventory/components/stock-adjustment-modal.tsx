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
import { useI18n } from "@/lib/i18n/context";
import { recordOpnameAction } from "../actions";
import { useProductSubmission, type OnProductCommitted } from "@/features/products/hooks/use-product-submission";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import type { InventoryItem } from "../types";

export interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetItem: InventoryItem | null;
  allItems: InventoryItem[];
  rawProducts?: ProductDto[];
  onCommitted?: OnProductCommitted;
}

interface FormInnerProps {
  initialItem: InventoryItem | null;
  allItems: InventoryItem[];
  rawProducts: ProductDto[];
  onClose: () => void;
  onCommitted?: OnProductCommitted;
}

function StockAdjustmentForm({
  initialItem,
  allItems,
  rawProducts,
  onClose,
  onCommitted,
}: FormInnerProps) {
  const { t } = useI18n();
  const c = t.products.persistent;

  const [selectedItemId, setSelectedItemId] = React.useState<string>(
    initialItem ? initialItem.id : allItems[0]?.id || ""
  );
  const activeItem = allItems.find((i) => i.id === selectedItemId) || initialItem;
  const activeProduct = rawProducts.find((p) => p.id === selectedItemId);

  const [newStockStr, setNewStockStr] = React.useState<string>(
    activeItem ? activeItem.currentStock.toString() : "0"
  );
  const [foundCost, setFoundCost] = React.useState<string>("0");
  const [note, setNote] = React.useState<string>("");

  const submission = useProductSubmission(recordOpnameAction, async (product) => {
    if (onCommitted) await onCommitted(product);
    onClose();
  });

  const currentStock = activeItem ? activeItem.currentStock : 0;
  const newStockNum = newStockStr.trim() ? Number(newStockStr) : NaN;
  const delta = isNaN(newStockNum) ? 0 : newStockNum - currentStock;
  const isFoundGoods = currentStock === 0 && newStockNum > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submission.blocked) return;

    if (!Number.isSafeInteger(newStockNum) || newStockNum < 0 || newStockNum > 1_000_000_000) {
      submission.reportError("Please enter a valid physical count (0 to 1,000,000,000).");
      return;
    }

    if (!activeItem) {
      submission.reportError("Please select an item.");
      return;
    }

    if (isFoundGoods && (!/^[0-9]{1,13}$/.test(foundCost.trim()) || BigInt(foundCost.trim()) > BigInt("1000000000000"))) {
      submission.reportError("Purchase total is required for found goods after zero balance (0 to 1,000,000,000,000 IDR).");
      return;
    }

    const version = activeProduct?.stockVersion || activeItem.stockVersion || "0";

    submission.submit({
      productId: activeItem.id,
      expectedStockVersion: String(version),
      countedQuantity: newStockNum,
      note: note.trim() || null,
      ...(isFoundGoods ? { foundPurchaseTotal: foundCost.trim() } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader className="border-b-[3px] border-ink p-4 bg-paper">
        <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-ink">
          <SlidersHorizontal className="h-5 w-5" />
          <span>{t.inventory.stockAdjustmentAudit}</span>
        </DialogTitle>
        <DialogDescription className="font-mono text-xs text-ink/60">
          {t.inventory.stockAdjustmentAuditDesc}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4 p-4 max-h-[65vh] overflow-y-auto">
        {submission.error && (
          <div role="alert" className="rounded-none bg-rose-50 border border-rose-300 p-2.5 text-xs text-rose-700 font-sans flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submission.error}</span>
          </div>
        )}

        {/* 1. Item Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="itemSelect" className="text-xs font-mono uppercase tracking-wider text-ink/70">
            {t.inventory.selectInventoryItem}
          </Label>
          {initialItem ? (
            <div className="p-3 border-[3px] border-ink bg-paper text-xs flex items-center justify-between">
              <div className="flex flex-col gap-1 min-w-0 pr-2">
                <SkuBadge code={initialItem.sku} />
                <span className="font-sans font-bold text-ink truncate">{initialItem.name}</span>
                <span className="font-mono text-[10px] text-ink/60">
                  {t.inventory.storageBin}: {initialItem.locationBin}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-ink shrink-0 text-right">
                {initialItem.currentStock} {initialItem.unit}
                <span className="block text-[10px] font-sans text-ink/60 font-normal">{t.inventory.onHandLabel}</span>
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
              disabled={submission.blocked}
              className="w-full h-9 border-[3px] border-ink bg-white px-3 text-xs font-bold text-ink focus:outline-none"
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
        <div className="grid grid-cols-2 gap-3 p-3 bg-paper border-[3px] border-ink">
          <div>
            <span className="text-[11px] font-mono uppercase text-ink/70 block">
              {t.inventory.currentOnHand}
            </span>
            <span className="font-mono text-lg font-bold text-ink">
              {currentStock} <span className="text-xs font-normal text-ink/60 font-sans">{activeItem?.unit}</span>
            </span>
          </div>

          <div>
            <Label htmlFor="newStock" className="text-[11px] font-mono uppercase text-ink/70 block">
              {t.inventory.actualPhysicalCount} *
            </Label>
            <Input
              id="newStock"
              type="number"
              min="0"
              max={1_000_000_000}
              step={1}
              required
              disabled={submission.blocked}
              value={newStockStr}
              onChange={(e) => setNewStockStr(e.target.value)}
              className="h-8 text-xs font-mono font-bold bg-white border-ink"
            />
          </div>

          {/* Delta feedback */}
          <div className="col-span-2 pt-2 border-t border-ink/20 flex items-center justify-between text-xs font-mono">
            <span className="text-ink/70 font-sans">{t.inventory.calculatedAdjustment}</span>
            <span
              className={cn(
                "font-bold px-2 py-0.5 border-[2px] border-ink",
                delta > 0 && "bg-emerald-100 text-emerald-900",
                delta < 0 && "bg-rose-100 text-rose-900",
                delta === 0 && "bg-white text-ink"
              )}
            >
              {delta > 0 ? `+${delta}` : delta} {activeItem?.unit || "units"}
            </span>
          </div>
        </div>

        {/* Zero difference informational note */}
        {delta === 0 && (
          <p className="text-[11px] font-mono text-ink/70 bg-paper p-2 border border-ink/20">
            Physical count matches system stock. Verification will be recorded as evidence without stock change.
          </p>
        )}

        {/* Found goods purchase total input */}
        {isFoundGoods && (
          <div className="space-y-1.5 p-3 bg-amber-50 border-[2px] border-ink">
            <Label htmlFor="foundCost" className="text-xs font-bold text-ink block">
              Purchase Total for Found Goods (IDR) *
            </Label>
            <Input
              id="foundCost"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{1,13}"
              maxLength={13}
              required
              disabled={submission.blocked}
              placeholder="0"
              value={foundCost}
              onChange={(e) => setFoundCost(e.target.value)}
              className="h-8 text-xs font-mono bg-white border-ink"
            />
            <p className="text-[10px] text-ink/70 font-mono">
              Purchase total required when recording found stock after a zero balance. Enter 0 for free goods.
            </p>
          </div>
        )}

        {/* 3. Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="adjNote" className="text-xs font-mono uppercase tracking-wider text-ink/70">
            {t.inventory.auditNote}
          </Label>
          <Input
            id="adjNote"
            type="text"
            maxLength={1000}
            disabled={submission.blocked}
            placeholder={t.modals?.notesOptional || "Optional notes..."}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 text-xs border-ink bg-white"
          />
        </div>
      </DialogBody>

      {/* Footer */}
      <DialogFooter className="border-t-[3px] border-ink p-4 flex justify-end gap-2 bg-paper">
        <Button
          type="button"
          variant="outline"
          disabled={submission.blocked}
          onClick={onClose}
          className="border-[3px] border-ink shadow-hard-sm"
        >
          {t.common.cancel}
        </Button>
        {submission.uncertain || submission.refreshFailed ? (
          <Button
            type="button"
            disabled={submission.pending}
            onClick={submission.retry}
            className="bg-acid text-ink border-[3px] border-ink shadow-hard-sm font-bold uppercase"
          >
            {c.retry}
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={submission.pending}
            className="bg-acid hover:bg-acid/90 text-ink border-[3px] border-ink shadow-hard-sm font-bold uppercase"
          >
            {submission.pending ? c.pending : t.inventory.applyAdjustment}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  targetItem,
  allItems,
  rawProducts = [],
  onCommitted,
}: StockAdjustmentModalProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
          <StockAdjustmentForm
            key={targetItem?.id || "new-adjust"}
            initialItem={targetItem}
            allItems={allItems}
            rawProducts={rawProducts}
            onClose={() => onOpenChange(false)}
            onCommitted={onCommitted}
          />
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
