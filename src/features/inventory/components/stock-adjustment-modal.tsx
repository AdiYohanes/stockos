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
import { SlidersHorizontal, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { recordOpnameAction } from "../actions";
import { useProductSubmission, type OnProductCommitted } from "@/features/products/hooks/use-product-submission";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import type { InventoryItem, StockMovement } from "../types";
import { getProductAction } from "@/features/products/actions";
import { formatProductMoney } from "@/features/products/format";
import { mapProductToInventoryItem } from "../adapters";
import { StockProductPicker } from "./stock-product-picker";

export interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetItem: InventoryItem | null;
  allItems: InventoryItem[];
  correction?: StockMovement | null;
  onCommitted?: OnProductCommitted;
}

interface FormInnerProps {
  selectedProduct: ProductDto | InventoryItem | null;
  initialItem: InventoryItem | null;
  correction?: StockMovement | null;
  selectedId: string;
  onSelect: (product: ProductDto) => void;
  onClose: () => void;
  onBlocked: (blocked: boolean) => void;
  onCommitted?: OnProductCommitted;
}

function StockAdjustmentForm({
  selectedProduct,
  initialItem,
  selectedId,
  onSelect,
  onClose,
  onBlocked,
  onCommitted,
  correction,
}: FormInnerProps) {
  const { t } = useI18n();
  const c = t.products.persistent;
  const q = t.inventory.quantityCorrection;

  const [snapshot, setSnapshot] = React.useState<ProductDto | InventoryItem | null>(() => selectedProduct ?? initialItem);
  const activeItem = snapshot && ("archivedAt" in snapshot ? mapProductToInventoryItem(snapshot) : snapshot);
  const archived = snapshot && "archivedAt" in snapshot ? !!snapshot.archivedAt : false;

  const [newStockStr, setNewStockStr] = React.useState<string>(
    correction ? "" : activeItem ? activeItem.currentStock.toString() : "0"
  );
  const [foundCost, setFoundCost] = React.useState<string>(correction ? "" : "0");
  const [note, setNote] = React.useState<string>("");

  const submission = useProductSubmission(recordOpnameAction, async (product) => {
    if (onCommitted) await onCommitted(product);
    onClose();
  });
  React.useEffect(() => { onBlocked(submission.blocked); return () => onBlocked(false); }, [submission.blocked, onBlocked]);
  const conflict = submission.code === "VERSION_CONFLICT";

  const currentStock = activeItem ? activeItem.currentStock : 0;
  const newStockNum = newStockStr.trim() ? Number(newStockStr) : NaN;
  const delta = isNaN(newStockNum) ? 0 : newStockNum - currentStock;
  const isFoundGoods = currentStock === 0 && newStockNum > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submission.blocked || conflict || archived) return;

    if (!Number.isSafeInteger(newStockNum) || newStockNum < 0 || newStockNum > 1_000_000_000) {
      submission.reportError(q.invalidCount);
      return;
    }

    if (!activeItem) {
      submission.reportError(t.products.persistent.selectRequired);
      return;
    }

    if (correction && (!note.trim() || note.trim().length > 1000)) {
      submission.reportError(t.inventory.costCorrection.reasonRequired);
      return;
    }

    if (isFoundGoods && (!/^[0-9]{1,13}$/.test(foundCost.trim()) || BigInt(foundCost.trim()) > BigInt("1000000000000"))) {
      submission.reportError(q.invalidFoundTotal);
      return;
    }

    const version = snapshot?.stockVersion || "0";

    submission.submit({
      productId: activeItem.id,
      expectedStockVersion: String(version),
      countedQuantity: newStockNum,
      note: note.trim() || null,
      ...(correction ? { correctionOfEventId: correction.id } : {}),
      ...(isFoundGoods ? { foundPurchaseTotal: foundCost.trim() } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader className="border-b-[3px] border-ink p-4 bg-paper">
        <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-ink">
          <SlidersHorizontal className="h-5 w-5" />
          <span>{correction ? q.title : t.inventory.stockAdjustmentAudit}</span>
        </DialogTitle>
        <DialogDescription className="font-mono text-xs text-ink/60">
          {correction ? q.description : t.inventory.stockAdjustmentAuditDesc}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4 p-4 max-h-[65vh] overflow-y-auto">
        {submission.error && (
          <div role="alert" className="rounded-none bg-rose-50 border border-rose-300 p-2.5 text-xs text-rose-700 font-sans flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submission.error}</span>
          </div>
        )}

        {correction && <section className="border-[3px] border-ink bg-paper p-3 space-y-2 text-xs break-words">
          <h3 className="font-bold">{q.original}</h3>
          <p className="font-mono break-all">{correction.id}</p>
          <p>{correction.kind && c[correction.kind]} · {correction.timestamp}</p>
          <p>{correction.sku} · {correction.itemName}</p>
          <p>{c.reference}: {correction.reference}</p>
          <p>{c.before}: {correction.previousStock} · {c.after}: {correction.newStock} ({correction.quantity > 0 ? "+" : ""}{correction.quantity})</p>
          {correction.note && <p>{correction.note}</p>}
        </section>}
        {correction && snapshot && "archivedAt" in snapshot && <p className="text-xs font-mono break-words">
          {c.stockVersion}: {snapshot.stockVersion} · {c.inventoryCostValue}: {formatProductMoney(snapshot.inventoryCostValue)}
        </p>}
        {conflict && <section className="border-[3px] border-ink p-3 space-y-2">
          <p className="font-bold">{c.conflict}</p>
          {submission.current ? <>
            <p>{c.currentState}: {submission.current.name} · {submission.current.currentStock} {submission.current.unit}</p>
            <p className="font-mono">{c.stockVersion}: {submission.current.stockVersion}</p>
            {correction && <>
              <p className="text-xs break-words">{c.inventoryCostValue}: {formatProductMoney(submission.current.inventoryCostValue)} · {c.averagePurchaseCost}: {formatProductMoney(submission.current.averagePurchaseCost)}</p>
              {submission.current.archivedAt && <p>{c.archivedHelp}</p>}
            </>}
            <p>{c.reviewCurrent}</p>
            <Button type="button" variant="outline" disabled={submission.pending} onClick={() => {
              if (!submission.current || submission.current.id !== selectedId) return;
              setSnapshot(submission.current);
              setNewStockStr("");
              setFoundCost(correction ? "" : "0");
              submission.review();
            }}>{c.reviewed}</Button>
          </> : <>
            <p>{c.reviewCurrent}</p>
            <Button type="button" variant="outline" disabled={submission.pending} onClick={submission.reloadCurrent}>{c.retry}</Button>
          </>}
        </section>}
        {archived && <p role="status">{c.archivedHelp}</p>}

        {/* 1. Item Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="itemSelect" className="text-xs font-mono uppercase tracking-wider text-ink/70">
            {t.inventory.selectInventoryItem}
          </Label>
          {initialItem ? (
            <div className="p-3 border-[3px] border-ink bg-paper text-xs flex items-center justify-between">
              <div className="flex flex-col gap-1 min-w-0 pr-2">
                <SkuBadge code={activeItem?.sku || initialItem.sku} />
                <span className="font-sans font-bold text-ink truncate">{activeItem?.name || initialItem.name}</span>
                <span className="font-mono text-[10px] text-ink/60">
                  {t.inventory.storageBin}: {activeItem?.locationBin || initialItem.locationBin}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-ink shrink-0 text-right">
                {currentStock} {activeItem?.unit || initialItem.unit}
                <span className="block text-[10px] font-sans text-ink/60 font-normal">{t.inventory.onHandLabel}</span>
              </span>
            </div>
          ) : (
            <StockProductPicker value={activeItem} disabled={submission.blocked} native onSelect={onSelect} />
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
              disabled={submission.blocked || conflict || archived}
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
        {Number.isFinite(newStockNum) && delta === 0 && (
          <p className="text-[11px] font-mono text-ink/70 bg-paper p-2 border border-ink/20">
            Physical count matches system stock. Verification will be recorded as evidence without stock change.
          </p>
        )}

        {/* Found goods purchase total input */}
        {isFoundGoods && (
          <div className="space-y-1.5 p-3 bg-amber-50 border-[2px] border-ink">
            <Label htmlFor="foundCost" className="text-xs font-bold text-ink block">
              {q.foundTotal} *
            </Label>
            <Input
              id="foundCost"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{1,13}"
              maxLength={correction ? undefined : 13}
              required
              disabled={submission.blocked || conflict || archived}
              placeholder="0"
              value={foundCost}
              onChange={(e) => setFoundCost(e.target.value)}
              className="h-8 text-xs font-mono bg-white border-ink"
            />
            <p className="text-[10px] text-ink/70 font-mono">
              {q.foundHelp}
            </p>
          </div>
        )}

        {/* 3. Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="adjNote" className="text-xs font-mono uppercase tracking-wider text-ink/70">
            {correction ? `${t.inventory.costCorrection.reason} *` : t.inventory.auditNote}
          </Label>
          <Input
            id="adjNote"
            type="text"
            maxLength={1000}
            required={!!correction}
            disabled={submission.blocked}
            placeholder={correction ? t.inventory.costCorrection.reason : t.modals.notesOptional}
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
            disabled={submission.pending || conflict || archived}
            className="bg-acid hover:bg-acid/90 text-ink border-[3px] border-ink shadow-hard-sm font-bold uppercase"
          >
            {submission.pending ? c.pending : correction ? q.title : t.inventory.applyAdjustment}
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
  correction = null,
  onCommitted,
}: StockAdjustmentModalProps) {
  const [blocked, setBlocked] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<ProductDto | null>(null);
  const { t } = useI18n();
  const [correctionProduct, setCorrectionProduct] = React.useState<ProductDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const itemId = correction?.itemId || targetItem?.id || selectedProduct?.id || allItems[0]?.id || "";
  React.useEffect(() => {
    if (!open || !correction) return;
    let active = true;
    async function read() {
      try {
        const result = await getProductAction({ id: itemId });
        if (!active) return;
        if (result.ok && result.data.id === itemId) setCorrectionProduct(result.data);
        else setError(!result.ok ? t.products.persistent.errors[result.code] || t.common.error : t.common.error);
      } catch { if (active) setError(t.common.error); }
    }
    void read();
    return () => { active = false; };
  }, [open, correction, itemId, attempt, t]);
  return (
    <DialogRoot open={open} onOpenChange={next => { if (next || !blocked) onOpenChange(next); }}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
          {!correction || correctionProduct ? <StockAdjustmentForm
            key={`${itemId}:${correction?.id || "opname"}`}
            selectedProduct={correction && correctionProduct ? correctionProduct : targetItem ?? selectedProduct ?? allItems[0] ?? null}
            initialItem={correction && correctionProduct ? mapProductToInventoryItem(correctionProduct) : targetItem}
            correction={correction}
            selectedId={itemId}
            onSelect={setSelectedProduct}
            onClose={() => onOpenChange(false)}
            onBlocked={setBlocked}
            onCommitted={onCommitted}
          /> : <>
            <DialogHeader className="border-b-[3px] border-ink bg-paper p-4">
              <DialogTitle>{t.inventory.quantityCorrection.title}</DialogTitle>
              <DialogDescription>{t.inventory.quantityCorrection.description}</DialogDescription>
            </DialogHeader>
            <DialogBody className="p-4">
              {error ? <p role="alert">{error}</p> : <p role="status">{t.common.loading}...</p>}
            </DialogBody>
            <DialogFooter className="border-t-[3px] border-ink bg-paper p-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
              {error && <Button type="button" onClick={() => { setError(null); setAttempt(value => value + 1); }}>{t.products.persistent.retry}</Button>}
            </DialogFooter>
          </>}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
