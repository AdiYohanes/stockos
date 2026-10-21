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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkuBadge } from "@/components/shared/sku-badge";
import { ArrowDownRight, ArrowUpRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { inventoryStockInAction, inventoryStockOutAction } from "../actions";
import { useProductSubmission, type OnProductCommitted } from "@/features/products/hooks/use-product-submission";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import type { InventoryItem } from "../types";
import { ProductPhoto } from "@/features/products/components/product-photo";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

export interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetItem: InventoryItem | null;
  defaultType: "in" | "out" | null;
  allItems: InventoryItem[];
  rawProducts?: ProductDto[];
  onCommitted?: OnProductCommitted;
}

interface FormInnerProps {
  initialItem: InventoryItem | null;
  initialType: "in" | "out" | null;
  allItems: InventoryItem[];
  onClose: () => void;
  onBlocked: (blocked: boolean) => void;
  onCommitted?: OnProductCommitted;
}

function StockMovementForm({
  initialItem,
  initialType,
  allItems,
  onClose,
  onBlocked,
  onCommitted,
}: FormInnerProps) {
  const { t } = useI18n();
  const c = t.products.persistent;

  const [selectedItemId, setSelectedItemId] = React.useState<string>(
    initialItem ? initialItem.id : allItems[0]?.id || ""
  );
  const [type, setType] = React.useState<"in" | "out">(initialType || "in");
  const isIn = type === "in";

  const [quantity, setQuantity] = React.useState<string>("");
  const [cartons, setCartons] = React.useState<boolean>(false);
  const [cartonCount, setCartonCount] = React.useState<string>("");
  const [unitsPerCarton, setUnitsPerCarton] = React.useState<string>("");
  const [purchaseTotal, setPurchaseTotal] = React.useState<string>("");
  const [reference, setReference] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");

  const activeItem = allItems.find((i) => i.id === selectedItemId) || initialItem;

  const computedQty = isIn && cartons ? Number(cartonCount) * Number(unitsPerCarton) : Number(quantity);

  const action = isIn ? inventoryStockInAction : inventoryStockOutAction;
  const submission = useProductSubmission(action, async (product) => {
    if (onCommitted) await onCommitted(product);
    onClose();
  });
  React.useEffect(() => { onBlocked(submission.blocked); return () => onBlocked(false); }, [submission.blocked, onBlocked]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submission.blocked) return;

    if (!activeItem) {
      submission.reportError(c.selectRequired);
      return;
    }

    if (!Number.isInteger(computedQty) || computedQty < 1 || computedQty > 1_000_000_000) {
      submission.reportError(c.invalidQuantity);
      return;
    }

    if (isIn && cartons && (!/^[1-9]\d*$/.test(cartonCount) || !/^[1-9]\d*$/.test(unitsPerCarton))) {
      submission.reportError(c.invalidQuantity);
      return;
    }

    if (!isIn && computedQty > activeItem.currentStock) {
      submission.reportError(t.products.persistent.errors.INSUFFICIENT_STOCK);
      return;
    }

    if (isIn && (!/^[0-9]{1,13}$/.test(purchaseTotal.trim()) || BigInt(purchaseTotal.trim()) > BigInt("1000000000000"))) {
      submission.reportError(c.freeCostHelp);
      return;
    }

    if (!activeItem) {
      submission.reportError(c.selectRequired);
      return;
    }

    submission.submit({
      productId: activeItem.id,
      quantity: computedQty,
      reference: reference.trim() || null,
      note: note.trim() || null,
      ...(isIn ? {
        purchaseTotal: purchaseTotal.trim(),
        ...(cartons ? { cartonCount: Number(cartonCount), unitsPerCarton: Number(unitsPerCarton) } : {}),
      } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader className="border-b-[3px] border-ink p-4 bg-paper">
        <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-ink">
          {isIn ? <ArrowDownRight className="h-5 w-5 text-emerald-700" /> : <ArrowUpRight className="h-5 w-5 text-rose-700" />}
          <span>{isIn ? t.inventory.stockInReceive : t.inventory.stockOutDispatch}</span>
        </DialogTitle>
        <DialogDescription className="font-mono text-xs text-ink/60">
          {isIn ? c.receipt : c.sold} · {activeItem?.sku || ""}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4 p-4 max-h-[65vh] overflow-y-auto">
        {submission.error && (
          <div role="alert" className="rounded-none bg-rose-50 border border-rose-300 p-2.5 text-xs text-rose-700 font-sans flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submission.error}</span>
          </div>
        )}

        {/* 1. Type Switcher */}
        <div>
          <Label className="text-xs font-mono uppercase tracking-wider text-ink/70">
            {t.inventory.movementType}
          </Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <button
              type="button"
              disabled={submission.blocked}
              onClick={() => setType("in")}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase border-[3px] border-ink transition-colors cursor-pointer",
                isIn
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-ink hover:bg-paper"
              )}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>{t.inventory.stockInReceive}</span>
            </button>

            <button
              type="button"
              disabled={submission.blocked}
              onClick={() => setType("out")}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase border-[3px] border-ink transition-colors cursor-pointer",
                !isIn
                  ? "bg-rose-600 text-white"
                  : "bg-white text-ink hover:bg-paper"
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>{t.inventory.stockOutDispatch}</span>
            </button>
          </div>
        </div>

        {/* 2. Item Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="itemSelect" className="text-xs font-mono uppercase tracking-wider text-ink/70">
            {t.inventory.inventoryItem}
          </Label>
          {initialItem ? (
            <div className="p-3 border-[3px] border-ink bg-paper text-xs flex items-center justify-between">
              <ProductPhoto photo={initialItem.photo} name={initialItem.name} className="mr-2" />
              <div className="flex flex-1 flex-col gap-1 min-w-0 pr-2">
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
            <Select value={selectedItemId} disabled={submission.blocked} onValueChange={value => { if (value) setSelectedItemId(value); }}>
              <SelectTrigger id="itemSelect" className="h-auto min-h-14 whitespace-normal text-left">
                {activeItem && <span className="flex min-w-0 items-center gap-2"><ProductPhoto photo={activeItem.photo} name={activeItem.name} /><span className="min-w-0 break-words">{activeItem.sku} - {activeItem.name} ({activeItem.currentStock} {activeItem.unit})</span></span>}
              </SelectTrigger>
              <SelectContent>{allItems.map(item => <SelectItem key={item.id} value={item.id} label={`${item.sku} ${item.name}`}>
                <span className="flex min-w-0 items-center gap-2"><ProductPhoto photo={item.photo} name={item.name} /><span className="min-w-0 whitespace-normal">{item.sku} - {item.name} ({item.currentStock} {item.unit})</span></span>
              </SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>

        {/* Carton mode toggle for stock in */}
        {isIn && (
          <label className="flex gap-2 items-center text-xs font-bold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={cartons}
              disabled={submission.blocked}
              onChange={(e) => setCartons(e.target.checked)}
              className="h-4 w-4 border-[2px] border-ink"
            />
            <span>{c.cartonMode}</span>
          </label>
        )}

        {/* Carton inputs */}
        {isIn && cartons && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-paper border-[2px] border-ink">
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink/70">{c.cartonCount} *</Label>
              <Input
                type="number"
                min={1}
                max={1_000_000_000}
                step={1}
                required
                disabled={submission.blocked}
                value={cartonCount}
                onChange={(e) => setCartonCount(e.target.value)}
                className="h-8 text-xs font-mono bg-white border-ink"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink/70">{c.unitsPerCarton} *</Label>
              <Input
                type="number"
                min={1}
                max={1_000_000_000}
                step={1}
                required
                disabled={submission.blocked}
                value={unitsPerCarton}
                onChange={(e) => setUnitsPerCarton(e.target.value)}
                className="h-8 text-xs font-mono bg-white border-ink"
              />
            </div>
          </div>
        )}

        {/* 3. Quantity & Purchase Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="quantity" className="text-xs font-mono uppercase tracking-wider text-ink/70">
              {t.modals.quantity} ({activeItem?.unit || "units"}) *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={isIn ? 1_000_000_000 : activeItem?.currentStock || 1}
              step={1}
              required
              readOnly={isIn && cartons}
              disabled={submission.blocked}
              placeholder="e.g. 25"
              value={isIn && cartons ? String(computedQty) : quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-9 text-xs font-mono font-bold bg-white border-ink"
            />
          </div>

          {isIn && (
            <div className="space-y-1.5">
              <Label htmlFor="purchaseTotal" className="text-xs font-mono uppercase tracking-wider text-ink/70">
                {c.purchaseTotal} *
              </Label>
              <Input
                id="purchaseTotal"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{1,13}"
                maxLength={13}
                required
                disabled={submission.blocked}
                placeholder="0"
                value={purchaseTotal}
                onChange={(e) => setPurchaseTotal(e.target.value)}
                className="h-9 text-xs font-mono font-bold bg-white border-ink"
              />
              <p className="text-[10px] text-ink/60 font-mono">{c.freeCostHelp}</p>
            </div>
          )}
        </div>

        {/* 4. Reference & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reference" className="text-xs font-mono uppercase tracking-wider text-ink/70">
              {c.reference}
            </Label>
            <Input
              id="reference"
              type="text"
              maxLength={120}
              disabled={submission.blocked}
              placeholder="e.g. NOTA-123"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-9 text-xs font-mono bg-white border-ink"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs font-mono uppercase tracking-wider text-ink/70">
              {t.modals.notes}
            </Label>
            <Input
              id="note"
              type="text"
              maxLength={1000}
              disabled={submission.blocked}
              placeholder={t.modals?.notesOptional || "Optional notes..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs bg-white border-ink"
            />
          </div>
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
            className={cn(
              "text-ink border-[3px] border-ink shadow-hard-sm font-bold uppercase",
              isIn ? "bg-emerald-400 hover:bg-emerald-500" : "bg-rose-400 hover:bg-rose-500"
            )}
          >
            {submission.pending ? c.pending : isIn ? t.inventory.confirmStockIn : t.inventory.confirmStockOut}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

export function StockMovementModal({
  open,
  onOpenChange,
  targetItem,
  defaultType,
  allItems,
  onCommitted,
}: StockMovementModalProps) {
  const [blocked, setBlocked] = React.useState(false);
  return (
    <DialogRoot open={open} onOpenChange={next => { if (next || !blocked) onOpenChange(next); }}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
          <StockMovementForm
            key={`${targetItem?.id || "new"}-${defaultType || "in"}`}
            initialItem={targetItem}
            initialType={defaultType}
            allItems={allItems}
            onClose={() => onOpenChange(false)}
            onBlocked={setBlocked}
            onCommitted={onCommitted}
          />
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
