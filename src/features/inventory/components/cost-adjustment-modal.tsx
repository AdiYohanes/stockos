"use client";

import * as React from "react";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkuBadge } from "@/components/shared/sku-badge";
import { useI18n } from "@/lib/i18n/context";
import { getProductAction } from "@/features/products/actions";
import { formatProductMoney } from "@/features/products/format";
import { useProductSubmission, type OnProductCommitted } from "@/features/products/hooks/use-product-submission";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import { adjustInventoryCostAction } from "../actions";

function CostSnapshot({ product }: { product: ProductDto }) {
  const { t } = useI18n();
  const p = t.products.persistent;
  return <div className="space-y-2 border-[3px] border-ink bg-paper p-3 text-xs break-words">
    <SkuBadge code={product.sku} />
    <p className="font-bold">{product.name}</p>
    <p>{t.inventory.onHand}: <span className="font-mono">{product.currentStock} {product.unit}</span></p>
    <p>{p.inventoryCostValue}: <span className="font-mono">{formatProductMoney(product.inventoryCostValue)}</span></p>
    <p>{p.averagePurchaseCost}: <span className="font-mono">{formatProductMoney(product.averagePurchaseCost)}</span></p>
    <p className="font-mono">{p.stockVersion}: {product.stockVersion}</p>
    {product.archivedAt && <p role="status">{p.archivedHelp}</p>}
  </div>;
}

function CostAdjustmentForm({ product, onClose, onBlocked, onCommitted }: {
  product: ProductDto;
  onClose: () => void;
  onBlocked: (blocked: boolean) => void;
  onCommitted: OnProductCommitted;
}) {
  const { t } = useI18n();
  const c = t.inventory.costCorrection;
  const p = t.products.persistent;
  const [snapshot, setSnapshot] = React.useState(product);
  const [total, setTotal] = React.useState("");
  const [reason, setReason] = React.useState("");
  const submission = useProductSubmission(adjustInventoryCostAction, async committed => {
    await onCommitted(committed);
    onClose();
  });
  React.useEffect(() => { onBlocked(submission.blocked); return () => onBlocked(false); }, [submission.blocked, onBlocked]);
  const conflict = submission.code === "VERSION_CONFLICT";
  const disabled = submission.blocked || conflict || !!snapshot.archivedAt;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (disabled) return;
    const replacement = total.trim();
    if (!/^[0-9]{1,13}$/.test(replacement) || BigInt(replacement) > BigInt("1000000000000")) {
      submission.reportError(c.invalidTotal);
      return;
    }
    if (!reason.trim() || reason.trim().length > 1000) {
      submission.reportError(c.reasonRequired);
      return;
    }
    if (snapshot.currentStock === 0 && BigInt(replacement) !== BigInt(0)) {
      submission.reportError(c.zeroStock);
      return;
    }
    submission.submit({ productId: snapshot.id, expectedStockVersion: snapshot.stockVersion,
      replacementTotalCost: replacement, reason: reason.trim() });
  }

  return <form onSubmit={submit}>
    <DialogBody className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
      {submission.error && <p role="alert" className="border-[3px] border-ink bg-rose-50 p-3 text-xs text-rose-700">{submission.error}</p>}
      <CostSnapshot product={snapshot} />
      {conflict && <section className="border-[3px] border-ink p-3 space-y-3 text-xs">
        <p className="font-bold">{p.conflict}</p>
        {submission.current ? <>
          <p>{p.currentState}</p>
          <CostSnapshot product={submission.current} />
          <Button type="button" variant="outline" className="max-w-full whitespace-normal h-auto min-h-10 focus-visible:ring-2 focus-visible:ring-ink" disabled={submission.pending} onClick={() => {
            if (!submission.current || submission.current.id !== snapshot.id) return;
            setSnapshot(submission.current);
            setTotal("");
            submission.review();
          }}>{p.reviewed}</Button>
        </> : <Button type="button" variant="outline" className="focus-visible:ring-2 focus-visible:ring-ink" onClick={submission.reloadCurrent}>{p.retry}</Button>}
      </section>}
      <div className="space-y-2">
        <Label htmlFor="replacementTotalCost">{c.replacement} *</Label>
        <Input id="replacementTotalCost" type="text" inputMode="numeric" pattern="[0-9]{1,13}" required
          disabled={disabled} value={total} onChange={event => setTotal(event.target.value)} aria-describedby="costHelp"
          className="font-mono bg-white border-[3px] border-ink" />
        <p id="costHelp" className="text-xs">{c.moneyHelp}</p>
        {snapshot.currentStock === 0 && <p className="text-xs">{c.zeroStock}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="costReason">{c.reason} *</Label>
        <Input id="costReason" required maxLength={1000} disabled={disabled} value={reason}
          onChange={event => setReason(event.target.value)} className="bg-white border-[3px] border-ink" />
      </div>
    </DialogBody>
    <DialogFooter className="border-t-[3px] border-ink bg-paper p-4 flex-wrap">
      <Button type="button" variant="outline" className="focus-visible:ring-2 focus-visible:ring-ink" disabled={submission.blocked} onClick={onClose}>{t.common.cancel}</Button>
      {submission.uncertain || submission.refreshFailed
        ? <Button type="button" disabled={submission.pending} onClick={submission.retry}>{p.retry}</Button>
        : <Button type="submit" disabled={disabled}>{submission.pending ? p.pending : c.title}</Button>}
    </DialogFooter>
  </form>;
}

export function CostAdjustmentModal({ productId, onClose, onCommitted }: {
  productId: string;
  onClose: () => void;
  onCommitted: OnProductCommitted;
}) {
  const { t } = useI18n();
  const [product, setProduct] = React.useState<ProductDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [blocked, setBlocked] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    async function read() {
      try {
        const result = await getProductAction({ id: productId });
        if (!active) return;
        if (result.ok && result.data.id === productId) setProduct(result.data);
        else setError(!result.ok ? t.products.persistent.errors[result.code] || t.common.error : t.common.error);
      } catch { if (active) setError(t.common.error); }
    }
    void read();
    return () => { active = false; };
  }, [productId, attempt, t]);

  return <DialogRoot open onOpenChange={open => { if (!open && !blocked) onClose(); }}>
    <DialogPortal>
      <DialogBackdrop />
      <DialogPopup className="max-w-md rounded-none border-[3px] border-ink bg-white shadow-hard-lg overflow-hidden">
        <DialogHeader className="border-b-[3px] border-ink bg-paper p-4">
          <DialogTitle className="font-display font-bold uppercase">{t.inventory.costCorrection.title}</DialogTitle>
          <DialogDescription className="text-xs">{t.inventory.costCorrection.description}</DialogDescription>
        </DialogHeader>
        {product ? <CostAdjustmentForm key={product.id} product={product} onClose={onClose} onBlocked={setBlocked} onCommitted={onCommitted} /> : <>
          <DialogBody className="p-4">
            {error ? <p role="alert">{error}</p> : <p role="status">{t.common.loading}...</p>}
          </DialogBody>
          <DialogFooter className="border-t-[3px] border-ink bg-paper p-4">
            <Button type="button" variant="outline" onClick={onClose}>{t.common.cancel}</Button>
            {error && <Button type="button" onClick={() => { setError(null); setAttempt(value => value + 1); }}>{t.products.persistent.retry}</Button>}
          </DialogFooter>
        </>}
      </DialogPopup>
    </DialogPortal>
  </DialogRoot>;
}
