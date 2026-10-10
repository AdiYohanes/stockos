"use client";

import * as React from "react";
import { Check, PackagePlus, Plus } from "lucide-react";
import { DialogRoot, DialogTrigger, DialogPortal, DialogBackdrop, DialogPopup, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { createProductAction, stockInAction, listProductsAction, getTextSuggestionsAction } from "../actions";
import type { ProductDto } from "../schemas/product-rpc.schema";
import { useProductSubmission, type OnProductCommitted } from "../hooks/use-product-submission";

interface ProductAddModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCommitted: OnProductCommitted;
}

export function ProductFormField({ label, id, error, ...props }: React.ComponentProps<typeof Input> & { label: string; id: string; error?: string }) {
  return <div className="space-y-1.5 min-w-0"><Label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-ink">{label}</Label><Input {...props} id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="h-10 rounded-none border-[3px] border-ink bg-white font-mono shadow-none focus-visible:shadow-hard-sm" />{error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}

function AddForm({ onClose, onCommitted, onBlocked }: { onClose: () => void; onCommitted: OnProductCommitted; onBlocked: (blocked: boolean) => void }) {
  const { t } = useI18n();
  const c = t.products.persistent;
  const [mode, setMode] = React.useState<"create" | "restock">("create");
  const [cartons, setCartons] = React.useState(false);
  const [count, setCount] = React.useState("");
  const [units, setUnits] = React.useState("");
  const [quantity, setQuantity] = React.useState("0");
  const [search, setSearch] = React.useState("");
  const [matches, setMatches] = React.useState<ProductDto[]>([]);
  const [selected, setSelected] = React.useState<ProductDto | null>(null);
  const [lookupError, setLookupError] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<{ category: string[]; supplier: string[] }>({ category: [], supplier: [] });
  const [created, setCreated] = React.useState<ProductDto | null>(null);
  const submission = useProductSubmission(mode === "create" ? createProductAction : stockInAction, async product => {
    await onCommitted(product);
    if (mode === "create") setCreated(product);
    else onClose();
  });
  React.useEffect(() => { onBlocked(submission.blocked); return () => onBlocked(false); }, [submission.blocked, onBlocked]);
  const computed = cartons ? Number(count) * Number(units) : Number(quantity);

  React.useEffect(() => {
    let active = true;
    React.startTransition(async () => {
      try {
        const categories = await getTextSuggestionsAction({ kind: "category", prefix: "" });
        const suppliers = await getTextSuggestionsAction({ kind: "supplier", prefix: "" });
        if (active) setSuggestions({ category: categories.ok ? categories.data.slice(0, 30) : [], supplier: suppliers.ok ? suppliers.data.slice(0, 30) : [] });
      } catch { /* Suggestions are optional; free text remains available. */ }
    });
    return () => { active = false; };
  }, []);

  function lookup() {
    setSelected(null);
    setLookupError(false);
    React.startTransition(async () => {
      try {
        const result = await listProductsAction({ search: search.trim(), archive: "active", page: 1, pageSize: 25, sort: "sku", direction: "asc" });
        if (result.ok) setMatches(result.data.items);
        else setLookupError(true);
      } catch { setLookupError(true); }
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission.blocked) return;
    if (!Number.isInteger(computed) || computed < (mode === "create" ? 0 : 1) || computed > 1_000_000_000 || (cartons && (!/^[1-9]\d*$/.test(count) || !/^[1-9]\d*$/.test(units)))) {
      submission.reportError(c.invalidQuantity); return;
    }
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const receipt = { ...(computed > 0 ? { purchaseTotal: text("purchaseTotal") } : {}), ...(cartons ? { cartonCount: Number(count), unitsPerCarton: Number(units) } : {}) };
    if (mode === "restock") {
      if (!selected) { submission.reportError(c.selectRequired); return; }
      submission.submit({ productId: selected.id, quantity: computed, purchaseTotal: text("purchaseTotal"), reference: text("reference") || null, note: text("note") || null, ...receipt });
    } else {
      submission.submit({ name: text("name"), sku: text("sku"), category: text("category"), unit: text("unit"), minStock: Number(text("minStock")), sellingPrice: text("sellingPrice"), supplier: text("supplier") || null, shelfLocation: text("shelfLocation") || null, barcode: text("barcode") || null, description: text("description") || null, openingQuantity: computed, ...receipt });
    }
  }

  if (created) return <div className="p-6 text-center space-y-5"><div className="mx-auto flex h-20 w-20 items-center justify-center border-[3px] border-ink bg-emerald-50 shadow-hard-sm motion-safe:animate-check-pop"><Check className="h-12 w-12 text-emerald-700" /></div><DialogTitle className="font-bold uppercase text-xl">{t.modals.addProduct.successTitle}</DialogTitle><DialogDescription>{created.name} · {created.sku}</DialogDescription><Button onClick={onClose}>{t.modals.finish}</Button><Button variant="outline" onClick={() => { setCreated(null); setQuantity("0"); setCartons(false); setCount(""); setUnits(""); }}>{t.modals.addProduct.addAnother}</Button></div>;

  return <form onSubmit={submit}>
    <div className="border-b-[3px] border-ink px-5 py-4"><DialogTitle className="flex items-center gap-3 text-lg font-bold uppercase"><PackagePlus className="h-5 w-5" />{t.modals.addProduct.title}</DialogTitle><DialogDescription className="text-xs font-mono mt-1">{mode === "create" ? c.create : c.restock}</DialogDescription></div>
    <DialogBody className="max-h-[65vh] overflow-y-auto">
      {submission.error && <p role="alert" className="text-sm text-destructive">{submission.error}</p>}
      <fieldset disabled={submission.blocked} className="space-y-4">
        <div className="flex gap-2"><Button type="button" variant={mode === "create" ? "default" : "outline"} onClick={() => { setMode("create"); setQuantity("0"); }}>{c.create}</Button><Button type="button" variant={mode === "restock" ? "default" : "outline"} onClick={() => { setMode("restock"); setQuantity(""); }}>{c.restock}</Button></div>
        {mode === "restock" ? <div className="space-y-3"><ProductFormField id="product-lookup" label={c.lookup} value={search} onChange={e => setSearch(e.target.value)} maxLength={120} /><Button type="button" variant="outline" onClick={lookup}>{c.search}</Button>{lookupError && <p role="alert">{t.common.error}</p>}<Label htmlFor="product-selection">{c.selectProduct}</Label><select id="product-selection" value={selected?.id ?? ""} onChange={e => setSelected(matches.find(p => p.id === e.target.value) ?? null)} className="w-full h-10 border-[3px] border-ink bg-white px-2" required><option value="">{c.selectProduct}</option>{matches.map(p => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}</select>{selected && <p className="font-mono text-xs break-all">{selected.id} · {selected.sku} · {selected.currentStock} {selected.unit}</p>}</div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProductFormField id="product-name" name="name" label={`${t.products.form.nameLabel} *`} required maxLength={120} error={submission.fieldErrors.name?.[0]} />
          <ProductFormField id="product-sku" name="sku" label={`${t.products.form.skuLabel} *`} required minLength={3} maxLength={64} error={submission.fieldErrors.sku?.[0]} />
          <ProductFormField id="product-category" name="category" label={`${t.products.form.categoryLabel} *`} required maxLength={120} list="add-categories" />
          <ProductFormField id="product-unit" name="unit" label={`${t.modals.addProduct.unitLabel} *`} required maxLength={30} />
          <ProductFormField id="product-min-stock" name="minStock" label={`${t.products.form.minStockLabel} *`} type="number" required min={0} max={1_000_000_000} step={1} defaultValue="0" />
          <ProductFormField id="product-sell" name="sellingPrice" label={`${t.products.form.priceLabel} *`} required inputMode="numeric" pattern="[0-9]{1,13}" maxLength={13} error={submission.fieldErrors.sellingPrice?.[0]} />
          <ProductFormField id="product-supplier" name="supplier" label={t.products.form.supplierLabel} maxLength={120} list="add-suppliers" />
          <ProductFormField id="product-shelf" name="shelfLocation" label={c.shelfLocation} maxLength={80} />
          <ProductFormField id="product-barcode" name="barcode" label={t.products.sheet.barcodeUpc} maxLength={64} />
          <ProductFormField id="product-description" name="description" label={t.products.form.descLabel} maxLength={2000} />
          <datalist id="add-categories">{suggestions.category.map(value => <option key={value} value={value} />)}</datalist><datalist id="add-suppliers">{suggestions.supplier.map(value => <option key={value} value={value} />)}</datalist>
        </div>}
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={cartons} onChange={e => setCartons(e.target.checked)} />{c.cartonMode}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cartons && <><ProductFormField id="product-cartons" label={c.cartonCount} value={count} onChange={e => setCount(e.target.value)} type="number" min={1} max={1_000_000_000} step={1} required /><ProductFormField id="product-carton-units" label={c.unitsPerCarton} value={units} onChange={e => setUnits(e.target.value)} type="number" min={1} max={1_000_000_000} step={1} required /></>}
          <ProductFormField id="product-pcs" label={mode === "create" ? c.openingQuantity : t.modals.quantity} value={cartons ? String(computed) : quantity} onChange={e => setQuantity(e.target.value)} readOnly={cartons} type="number" min={mode === "create" ? 0 : 1} max={1_000_000_000} step={1} required />
          <ProductFormField id="product-purchase" name="purchaseTotal" label={`${c.purchaseTotal}${computed > 0 ? " *" : ""}`} required={computed > 0} disabled={computed === 0} inputMode="numeric" pattern="[0-9]{1,13}" maxLength={13} error={submission.fieldErrors.purchaseTotal?.[0]} />
          {mode === "restock" && <><ProductFormField id="product-reference" name="reference" label={c.reference} maxLength={120} /><ProductFormField id="product-note" name="note" label={t.modals.notes} maxLength={1000} /></>}
        </div><p className="text-xs text-ink/70">{c.freeCostHelp}</p>
      </fieldset>
    </DialogBody>
    <DialogFooter className="border-t-[3px] border-ink"><Button type="button" variant="outline" disabled={submission.blocked} onClick={onClose}>{t.common.cancel}</Button>{submission.uncertain || submission.refreshFailed ? <Button type="button" disabled={submission.pending} onClick={submission.retry}>{c.retry}</Button> : <Button type="submit" disabled={submission.pending}><Plus className="h-4 w-4" />{submission.pending ? c.pending : mode === "create" ? t.modals.addProduct.submit : c.restock}</Button>}</DialogFooter>
  </form>;
}

export function ProductAddModal({ children, open: controlledOpen, onOpenChange, onCommitted }: ProductAddModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [blocked, setBlocked] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const changeOpen = (next: boolean) => { if (!next && blocked) return; if (onOpenChange) onOpenChange(next); else setInternalOpen(next); };
  return <DialogRoot open={open} onOpenChange={changeOpen}>{children && <DialogTrigger render={children as React.ReactElement} />}<DialogPortal><DialogBackdrop /><DialogPopup className="max-w-xl overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg"><AddForm onClose={() => { if (onOpenChange) onOpenChange(false); else setInternalOpen(false); }} onCommitted={onCommitted} onBlocked={setBlocked} /></DialogPopup></DialogPortal></DialogRoot>;
}
