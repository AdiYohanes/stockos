"use client";

import * as React from "react";
import { Edit2 } from "lucide-react";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { updateProductAction, getTextSuggestionsAction } from "../actions";
import type { ProductDto } from "../schemas/product-rpc.schema";
import { useProductSubmission, type OnProductCommitted } from "../hooks/use-product-submission";
import { ProductFormField } from "./product-add-modal";

interface EditProductModalProps {
  product: ProductDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommitted: OnProductCommitted;
  identityLocked?: boolean;
}

function EditForm({ product, identityLocked, onClose, onCommitted, onBlocked }: { product: ProductDto; identityLocked: boolean; onClose: () => void; onCommitted: OnProductCommitted; onBlocked: (value: boolean) => void }) {
  const { t } = useI18n();
  const c = t.products.persistent;
  const [expectedVersion, setExpectedVersion] = React.useState(product.metadataVersion);
  const [suggestions, setSuggestions] = React.useState<{ category: string[]; supplier: string[] }>({ category: [], supplier: [] });
  const submission = useProductSubmission(updateProductAction, async value => { await onCommitted(value); onClose(); });
  React.useEffect(() => { onBlocked(submission.blocked); return () => onBlocked(false); }, [submission.blocked, onBlocked]);
  React.useEffect(() => {
    let active = true;
    React.startTransition(async () => {
      try {
        const category = await getTextSuggestionsAction({ kind: "category", prefix: "" });
        const supplier = await getTextSuggestionsAction({ kind: "supplier", prefix: "" });
        if (active) setSuggestions({ category: category.ok ? category.data.slice(0, 30) : [], supplier: supplier.ok ? supplier.data.slice(0, 30) : [] });
      } catch { /* Optional suggestions never block free-text metadata. */ }
    });
    return () => { active = false; };
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission.blocked || submission.code === "VERSION_CONFLICT" || product.archivedAt) return;
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    submission.submit({ productId: product.id, expectedMetadataVersion: expectedVersion, patch: {
      name: text("name"), category: text("category"), sellingPrice: text("sellingPrice"), minStock: Number(text("minStock")),
      ...(identityLocked ? {} : { sku: text("sku"), unit: text("unit") }),
      supplier: text("supplier") || null, shelfLocation: text("shelfLocation") || null, barcode: text("barcode") || null, description: text("description") || null,
    } });
  }

  return <form onSubmit={submit}><div className="px-5 py-4 border-b-[3px] border-ink"><DialogTitle className="flex items-center gap-2 font-bold uppercase text-lg"><Edit2 className="h-5 w-5" />{t.products.editProduct}</DialogTitle><DialogDescription className="font-mono text-xs mt-1">{product.sku} · {product.currentStock} {product.unit}</DialogDescription></div>
    <DialogBody className="max-h-[65vh] overflow-y-auto">
      {submission.error && <p role="alert" className="text-sm text-destructive">{submission.error}</p>}
      {product.archivedAt && <p role="status">{c.archivedHelp}</p>}
      {identityLocked && <p className="text-xs">{c.identityLocked}</p>}
      {submission.code === "VERSION_CONFLICT" && <section className="border-[3px] border-ink p-3 space-y-2"><p className="font-bold">{c.conflict}</p>{submission.current ? <><p>{c.currentState}: {submission.current.name} · {submission.current.sku} · {submission.current.category} · {submission.current.unit}</p><p className="font-mono">{t.products.form.priceLabel}: {submission.current.sellingPrice} · {t.products.form.minStockLabel}: {submission.current.minStock} · {c.metadataVersion}: {submission.current.metadataVersion}</p><p>{c.shelfLocation}: {submission.current.shelfLocation ?? "—"} · {t.products.form.supplierLabel}: {submission.current.supplier ?? "—"}</p><p>{t.products.sheet.barcodeUpc}: {submission.current.barcode ?? "—"}</p><p className="break-words">{submission.current.description ?? "—"}</p><Button type="button" variant="outline" onClick={() => { setExpectedVersion(submission.current!.metadataVersion); submission.review(); }}>{c.reviewed}</Button></> : <><p>{c.reviewCurrent}</p><Button type="button" variant="outline" onClick={submission.reloadCurrent}>{c.retry}</Button></>}</section>}
      <fieldset disabled={submission.blocked || !!product.archivedAt} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ProductFormField id="edit-name" name="name" label={`${t.products.form.nameLabel} *`} defaultValue={product.name} required maxLength={120} error={submission.fieldErrors.name?.[0]} />
        <ProductFormField id="edit-sku" name="sku" label={`${t.products.form.skuLabel} *`} defaultValue={product.sku} disabled={identityLocked} required minLength={3} maxLength={64} />
        <ProductFormField id="edit-category" name="category" label={`${t.products.form.categoryLabel} *`} defaultValue={product.category} list="edit-categories" required maxLength={120} />
        <ProductFormField id="edit-unit" name="unit" label={`${t.modals.addProduct.unitLabel} *`} defaultValue={product.unit} disabled={identityLocked} required maxLength={30} />
        <ProductFormField id="edit-selling-price" name="sellingPrice" label={`${t.products.form.priceLabel} *`} defaultValue={product.sellingPrice} required pattern="[0-9]{1,13}" inputMode="numeric" maxLength={13} />
        <ProductFormField id="edit-min-stock" name="minStock" label={`${t.products.form.minStockLabel} *`} defaultValue={product.minStock} required type="number" min={0} max={1_000_000_000} step={1} />
        <ProductFormField id="edit-supplier" name="supplier" label={t.products.form.supplierLabel} defaultValue={product.supplier ?? ""} list="edit-suppliers" maxLength={120} />
        <ProductFormField id="edit-shelfLocation" name="shelfLocation" label={c.shelfLocation} defaultValue={product.shelfLocation ?? ""} maxLength={80} />
        <ProductFormField id="edit-barcode" name="barcode" label={t.products.sheet.barcodeUpc} defaultValue={product.barcode ?? ""} maxLength={64} />
        <ProductFormField id="edit-description" name="description" label={t.products.form.descLabel} defaultValue={product.description ?? ""} maxLength={2000} />
        <datalist id="edit-categories">{suggestions.category.map(value => <option key={value} value={value} />)}</datalist><datalist id="edit-suppliers">{suggestions.supplier.map(value => <option key={value} value={value} />)}</datalist>
      </fieldset>
    </DialogBody><DialogFooter className="border-t-[3px] border-ink"><Button type="button" variant="outline" disabled={submission.blocked} onClick={onClose}>{t.common.cancel}</Button>{submission.uncertain || submission.refreshFailed ? <Button type="button" disabled={submission.pending} onClick={submission.retry}>{c.retry}</Button> : <Button type="submit" disabled={submission.pending || !!product.archivedAt || submission.code === "VERSION_CONFLICT"}>{submission.pending ? c.pending : t.common.save}</Button>}</DialogFooter></form>;
}

export function EditProductModal({ product, open, onOpenChange, onCommitted, identityLocked = true }: EditProductModalProps) {
  const [blocked, setBlocked] = React.useState(false);
  if (!product) return null;
  return <DialogRoot open={open} onOpenChange={next => { if (!blocked || next) onOpenChange(next); }}><DialogPortal><DialogBackdrop /><DialogPopup className="max-w-xl overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg"><EditForm key={product.id} product={product} identityLocked={identityLocked} onClose={() => onOpenChange(false)} onCommitted={onCommitted} onBlocked={setBlocked} /></DialogPopup></DialogPortal></DialogRoot>;
}
