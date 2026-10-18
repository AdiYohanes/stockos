"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { stockInAction, stockOutAction } from "../actions";
import type { ProductDto } from "../schemas/product-rpc.schema";
import { useProductSubmission, type OnProductCommitted } from "../hooks/use-product-submission";
import { ProductFormField } from "./product-add-modal";

interface QuickMovementModalProps {
  product: ProductDto | null;
  type: "in" | "out" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommitted: OnProductCommitted;
}

function MovementForm({ product, type, onClose, onCommitted, onBlocked }: { product: ProductDto; type: "in" | "out"; onClose: () => void; onCommitted: OnProductCommitted; onBlocked: (blocked: boolean) => void }) {
  const { t } = useI18n();
  const c = t.products.persistent;
  const isIn = type === "in";
  const [quantity, setQuantity] = React.useState("");
  const [cartons, setCartons] = React.useState(false);
  const [count, setCount] = React.useState("");
  const [units, setUnits] = React.useState("");
  const computed = isIn && cartons ? Number(count) * Number(units) : Number(quantity);
  const submission = useProductSubmission(isIn ? stockInAction : stockOutAction, async value => { await onCommitted(value); onClose(); });
  React.useEffect(() => { onBlocked(submission.blocked); return () => onBlocked(false); }, [submission.blocked, onBlocked]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission.blocked || product.archivedAt) return;
    if (!Number.isInteger(computed) || computed < 1 || computed > 1_000_000_000 || (cartons && (!/^[1-9]\d*$/.test(count) || !/^[1-9]\d*$/.test(units)))) { submission.reportError(c.invalidQuantity); return; }
    const data = new FormData(event.currentTarget);
    submission.submit({ productId: product.id, quantity: computed, reference: String(data.get("reference") ?? "").trim() || null, note: String(data.get("note") ?? "").trim() || null,
      ...(isIn ? { purchaseTotal: String(data.get("purchaseTotal") ?? "").trim(), ...(cartons ? { cartonCount: Number(count), unitsPerCarton: Number(units) } : {}) } : {}),
    });
  }

  return <form onSubmit={submit}><div className="px-5 py-4 border-b-[3px] border-ink"><DialogTitle className="flex items-center gap-3 text-lg font-bold uppercase">{isIn ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}{isIn ? t.modals.stockIn.title : c.sold}</DialogTitle><DialogDescription className="text-xs font-mono mt-1">{isIn ? c.receipt : c.sold} · {product.sku}</DialogDescription></div>
    <DialogBody className="max-h-[65vh] overflow-y-auto space-y-3">
      {submission.error && <p role="alert" className="text-sm text-destructive">{submission.error}</p>}
      {product.archivedAt && <p role="status">{c.archivedHelp}</p>}
      <div className="border-[3px] border-ink bg-paper p-3 shadow-hard-sm"><p className="font-bold break-words">{product.name}</p><p className="font-mono text-xs">{product.sku} · {t.products.deleteDialog.currentStock}: {product.currentStock} {product.unit}</p></div>
      <fieldset disabled={submission.blocked || !!product.archivedAt} className="space-y-3">
        {isIn && <label className="flex gap-2 items-center text-sm font-bold"><input type="checkbox" checked={cartons} onChange={e => setCartons(e.target.checked)} />{c.cartonMode}</label>}
        {isIn && cartons && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><ProductFormField id="mov-cartons" label={c.cartonCount} type="number" min={1} max={1_000_000_000} step={1} required value={count} onChange={e => setCount(e.target.value)} /><ProductFormField id="mov-carton-units" label={c.unitsPerCarton} type="number" min={1} max={1_000_000_000} step={1} required value={units} onChange={e => setUnits(e.target.value)} /></div>}
        <ProductFormField id="mov-qty" label={`${t.modals.quantity} (${product.unit}) *`} type="number" min={1} max={isIn ? 1_000_000_000 : product.currentStock} step={1} required value={isIn && cartons ? String(computed) : quantity} readOnly={isIn && cartons} onChange={e => setQuantity(e.target.value)} error={submission.fieldErrors.quantity?.[0]} />
        {isIn && <><ProductFormField id="mov-purchase" name="purchaseTotal" label={`${c.purchaseTotal} *`} required inputMode="numeric" pattern="[0-9]{1,13}" maxLength={13} error={submission.fieldErrors.purchaseTotal?.[0]} /><p className="text-xs text-ink/70">{c.freeCostHelp}</p></>}
        <ProductFormField id="mov-ref" name="reference" label={c.reference} maxLength={120} />
        <ProductFormField id="mov-note" name="note" label={t.modals.notes} maxLength={1000} />
      </fieldset>
    </DialogBody><DialogFooter className="border-t-[3px] border-ink"><Button type="button" variant="outline" disabled={submission.blocked} onClick={onClose}>{t.common.cancel}</Button>{submission.uncertain || submission.refreshFailed ? <Button type="button" disabled={submission.pending} onClick={submission.retry}>{c.retry}</Button> : <Button type="submit" disabled={submission.pending || !!product.archivedAt} className={isIn ? "bg-emerald-400 hover:bg-emerald-500 text-ink" : "bg-rose-400 hover:bg-rose-500 text-ink"}>{submission.pending ? c.pending : isIn ? t.modals.stockIn.submit : t.modals.stockOut.submit}</Button>}</DialogFooter></form>;
}

export function QuickMovementModal({ product, type, open, onOpenChange, onCommitted }: QuickMovementModalProps) {
  const [blocked, setBlocked] = React.useState(false);
  if (!product || !type) return null;
  return <DialogRoot open={open} onOpenChange={next => { if (next || !blocked) onOpenChange(next); }}><DialogPortal><DialogBackdrop /><DialogPopup className="max-w-md overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg"><MovementForm key={`${product.id}-${type}`} product={product} type={type} onClose={() => onOpenChange(false)} onCommitted={onCommitted} onBlocked={setBlocked} /></DialogPopup></DialogPortal></DialogRoot>;
}
