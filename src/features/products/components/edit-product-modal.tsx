"use client";

import * as React from "react";
import { Edit2, Plus } from "lucide-react";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { updateProductAction, getTextSuggestionsAction } from "../actions";
import type { ProductDto } from "../schemas/product-rpc.schema";
import { useProductSubmission, type OnProductCommitted } from "../hooks/use-product-submission";
import { WARUNG_CATEGORIES, WARUNG_UNITS } from "../constants";
import { ProductFormField, useTaxonomyQuickAdd } from "./product-add-modal";
import { ProductPhotoField, usePhotoDraft } from "./product-photo-field";
import { ProductPhoto } from "./product-photo";
import { SupplierQuickAddDialog } from "./supplier-quick-add-dialog";

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
  const [suggestions, setSuggestions] = React.useState<{ category: string[]; supplier: string[] }>({ category: [...WARUNG_CATEGORIES], supplier: [] });
  const [productCategory, setProductCategory] = React.useState(product.category);
  const [productSupplier, setProductSupplier] = React.useState(product.supplier ?? "");
  const [supplierDialogOpen, setSupplierDialogOpen] = React.useState(false);
  const photo = usePhotoDraft();
  const submission = useProductSubmission(input => updateProductAction(input, photo.files.current), async value => { await onCommitted(value); onClose(); });
  React.useEffect(() => { onBlocked(submission.blocked || photo.processing); return () => onBlocked(false); }, [submission.blocked, photo.processing, onBlocked]);
  const loadSuggestions = React.useCallback(() => {
    React.startTransition(async () => {
      try {
        const category = await getTextSuggestionsAction({ kind: "category", prefix: "" });
        const supplier = await getTextSuggestionsAction({ kind: "supplier", prefix: "" });
        setSuggestions({
          category: category.ok && category.data.length > 0 ? Array.from(new Set([...category.data, ...WARUNG_CATEGORIES])) : [...WARUNG_CATEGORIES],
          supplier: supplier.ok ? supplier.data.slice(0, 30) : [],
        });
      } catch { /* Optional suggestions never block free-text metadata. */ }
    });
  }, []);
  React.useEffect(() => { loadSuggestions(); }, [loadSuggestions]);
  const quickAdd = useTaxonomyQuickAdd(loadSuggestions);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission.blocked || photo.processing || submission.code === "VERSION_CONFLICT" || product.archivedAt) return;
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    submission.submit({ productId: product.id, expectedMetadataVersion: expectedVersion, patch: {
      name: text("name"), category: productCategory.trim(), sellingPrice: text("sellingPrice"), minStock: Number(text("minStock")),
      ...photo.patch, ...(identityLocked ? {} : { sku: text("sku"), unit: text("unit") }),
      supplier: productSupplier.trim() || null, shelfLocation: text("shelfLocation") || null, barcode: text("barcode") || null, description: text("description") || null,
    } });
  }

  return <form onSubmit={submit}><div className="px-5 py-4 border-b-[3px] border-ink"><DialogTitle className="flex items-center gap-2 font-bold uppercase text-lg"><Edit2 className="h-5 w-5" />{t.products.editProduct}</DialogTitle><DialogDescription className="font-mono text-xs mt-1">{product.sku} · {product.currentStock} {product.unit}</DialogDescription></div>
    <DialogBody className="max-h-[65vh] overflow-y-auto">
      {submission.error && <p role="alert" className="text-sm text-destructive">{submission.error}</p>}
      {quickAdd.error && <p role="alert" className="text-xs text-destructive">{quickAdd.error}</p>}
      {product.archivedAt && <p role="status">{c.archivedHelp}</p>}
      {identityLocked && <p className="text-xs">{c.identityLocked}</p>}
      {submission.code === "VERSION_CONFLICT" && <section className="border-[3px] border-ink p-3 space-y-2"><p className="font-bold">{c.conflict}</p>{submission.current ? <><ProductPhoto photo={submission.current.photo} name={submission.current.name} /><p>{c.currentState}: {submission.current.name} · {submission.current.sku} · {submission.current.category} · {submission.current.unit}</p><p className="font-mono">{t.products.form.priceLabel}: {submission.current.sellingPrice} · {t.products.form.minStockLabel}: {submission.current.minStock} · {c.metadataVersion}: {submission.current.metadataVersion}</p><p>{c.shelfLocation}: {submission.current.shelfLocation ?? "—"} · {t.products.form.supplierLabel}: {submission.current.supplier ?? "—"}</p><p>{t.products.sheet.barcodeUpc}: {submission.current.barcode ?? "—"}</p><p className="break-words">{submission.current.description ?? "—"}</p><Button type="button" variant="outline" onClick={() => { setExpectedVersion(submission.current!.metadataVersion); submission.review(); }}>{c.reviewed}</Button></> : <><p>{c.reviewCurrent}</p><Button type="button" variant="outline" onClick={submission.reloadCurrent}>{c.retry}</Button></>}</section>}
      <fieldset disabled={submission.blocked || photo.processing || !!product.archivedAt} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ProductPhotoField value={photo} photo={product.photo} disabled={submission.blocked || !!product.archivedAt} />
        <ProductFormField id="edit-name" name="name" label={`${t.products.form.nameLabel} *`} defaultValue={product.name} required maxLength={120} error={submission.fieldErrors.name?.[0]} />
        <ProductFormField id="edit-sku" name="sku" label={`${t.products.form.skuLabel} *`} defaultValue={product.sku} disabled={identityLocked} required minLength={3} maxLength={64} />
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-category" className="text-[10px] font-bold uppercase tracking-widest text-ink">{t.products.form.categoryLabel} *</Label>
            {productCategory.trim() && !suggestions.category.includes(productCategory.trim()) && (
              <Button type="button" variant="outline" size="sm" disabled={quickAdd.pendingKind !== null}
                onClick={() => { void quickAdd.add("category", productCategory).then(added => { if (added) setProductCategory(added); }); }}
                className="h-5 rounded-none border-[1.5px] border-ink px-1.5 py-0 font-mono text-[10px] font-bold shadow-neo-sm">
                <Plus className="mr-0.5 h-3 w-3" />{t.settings.taxonomyQuickAddCategory.replace("{name}", productCategory.trim())}
              </Button>
            )}
          </div>
          <Input
            id="edit-category" required maxLength={120} list="edit-categories" value={productCategory}
            onChange={(e) => setProductCategory(e.currentTarget.value)}
            className="h-10 rounded-none border-[3px] border-ink bg-white font-mono shadow-none focus-visible:shadow-hard-sm"
          />
        </div>
        <ProductFormField id="edit-unit" name="unit" label={`${t.modals.addProduct.unitLabel} *`} defaultValue={product.unit} disabled={identityLocked} required maxLength={30} list="edit-units" />
        <ProductFormField id="edit-selling-price" name="sellingPrice" label={`${t.products.form.priceLabel} *`} defaultValue={product.sellingPrice} required pattern="[0-9]{1,13}" inputMode="numeric" maxLength={13} />
        <ProductFormField id="edit-min-stock" name="minStock" label={`${t.products.form.minStockLabel} *`} defaultValue={product.minStock} required type="number" min={0} max={1_000_000_000} step={1} />
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-supplier" className="text-[10px] font-bold uppercase tracking-widest text-ink">{t.products.form.supplierLabel}</Label>
            <button type="button" aria-label={t.settings.taxonomyQuickAddSupplierTitle}
              onClick={() => setSupplierDialogOpen(true)}
              className="inline-flex h-5 items-center rounded-none border-[1.5px] border-ink px-1.5 font-mono text-[10px] font-bold shadow-neo-sm hover:bg-slate-100 disabled:opacity-50">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <Input
            id="edit-supplier" maxLength={120} list="edit-suppliers" value={productSupplier}
            onChange={(e) => setProductSupplier(e.currentTarget.value)}
            className="h-10 rounded-none border-[3px] border-ink bg-white font-mono shadow-none focus-visible:shadow-hard-sm"
          />
        </div>
        <ProductFormField id="edit-shelfLocation" name="shelfLocation" label={c.shelfLocation} defaultValue={product.shelfLocation ?? ""} maxLength={80} />
        <ProductFormField id="edit-barcode" name="barcode" label={t.products.sheet.barcodeUpc} defaultValue={product.barcode ?? ""} maxLength={64} />
        <ProductFormField id="edit-description" name="description" label={t.products.form.descLabel} defaultValue={product.description ?? ""} maxLength={2000} />
        <datalist id="edit-categories">{suggestions.category.map(value => <option key={value} value={value} />)}</datalist>
        <datalist id="edit-suppliers">{suggestions.supplier.map(value => <option key={value} value={value} />)}</datalist>
        <datalist id="edit-units">{WARUNG_UNITS.map(value => <option key={value} value={value} />)}</datalist>
      </fieldset>
    </DialogBody><DialogFooter className="border-t-[3px] border-ink"><Button type="button" variant="outline" disabled={submission.blocked || photo.processing} onClick={onClose}>{t.common.cancel}</Button>{submission.uncertain || submission.refreshFailed ? <Button type="button" disabled={submission.pending} onClick={submission.retry}>{c.retry}</Button> : <Button type="submit" disabled={submission.pending || photo.processing || !!product.archivedAt || submission.code === "VERSION_CONFLICT"}>{submission.pending ? c.pending : t.common.save}</Button>}</DialogFooter>
    <SupplierQuickAddDialog open={supplierDialogOpen} initialName={productSupplier} onClose={() => setSupplierDialogOpen(false)}
      onCreated={name => { loadSuggestions(); setProductSupplier(name); setSupplierDialogOpen(false); }} />
    </form>;
}

export function EditProductModal({ product, open, onOpenChange, onCommitted, identityLocked = true }: EditProductModalProps) {
  const [blocked, setBlocked] = React.useState(false);
  if (!product) return null;
  return <DialogRoot open={open} onOpenChange={next => { if (!blocked || next) onOpenChange(next); }}><DialogPortal><DialogBackdrop /><DialogPopup className="max-w-xl overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg"><EditForm key={product.id} product={product} identityLocked={identityLocked} onClose={() => onOpenChange(false)} onCommitted={onCommitted} onBlocked={setBlocked} /></DialogPopup></DialogPortal></DialogRoot>;
}
