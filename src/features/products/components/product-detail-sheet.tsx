"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, Edit2, History, Info, X, Archive, Package } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SkuBadge } from "@/components/shared/sku-badge";
import { useI18n } from "@/lib/i18n/context";
import { getProductHistoryAction } from "../actions";
import type { ProductDto } from "../schemas/product-rpc.schema";
import { formatProductMoney } from "../format";

type HistoryData = Extract<Awaited<ReturnType<typeof getProductHistoryAction>>, { ok: true }>["data"];
interface ProductDetailSheetProps {
  product: ProductDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (product: ProductDto) => void;
  onMovement?: (product: ProductDto, type: "in" | "out") => void;
  onLifecycle?: (product: ProductDto) => void;
}

export function ProductDetailSheet({ product, open, onOpenChange, onEdit, onMovement, onLifecycle }: ProductDetailSheetProps) {
  const { t, language } = useI18n();
  const c = t.products.persistent;
  const [tab, setTab] = React.useState<"specs" | "history">("specs");
  const [page, setPage] = React.useState(1);
  const [history, setHistory] = React.useState<HistoryData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [reload, setReload] = React.useState(0);
  const id = product?.id;
  const version = product?.stockVersion;
  React.useEffect(() => {
    if (!open || !id || tab !== "history") return;
    let active = true;
    React.startTransition(async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await getProductHistoryAction({ productId: id, page, pageSize: 10 });
        if (!active) return;
        if (result.ok) setHistory(result.data);
        else setError(true);
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [id, version, product, open, page, tab, reload]);
  if (!product) return null;
  const money = formatProductMoney;
  const status = product.archivedAt ? c.archived : product.stockStatus === "out_of_stock" ? t.products.outOfStock : product.stockStatus === "low_stock" ? t.products.lowStock : t.products.inStock;
  const kinds: Record<string, string> = { opening: c.opening, receipt: c.receipt, sold: c.sold, opname: c.opname, cost_adjustment: c.cost_adjustment };
  const values: [string, string | null][] = [
    [t.products.form.priceLabel, product.sellingPrice], [c.inventoryCostValue, product.inventoryCostValue],
    [c.averagePurchaseCost, product.averagePurchaseCost], [c.potentialSellingValue, product.potentialSellingValue], [c.potentialGrossProfit, product.potentialGrossProfit],
  ];
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent showCloseButton={false} className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg gap-0 border-l-[3px] border-ink bg-white shadow-hard-lg motion-reduce:transition-none">
    <SheetHeader className="border-b-[3px] border-ink pr-14"><div className="flex gap-2 items-center flex-wrap"><SkuBadge code={product.sku} /><span className="inline-flex gap-1.5 items-center text-xs font-bold"><span className={`h-2 w-2 border border-ink ${product.archivedAt ? "bg-ink/30" : product.stockStatus === "out_of_stock" ? "bg-rose-500" : product.stockStatus === "low_stock" ? "bg-amber-500" : "bg-emerald-500"}`} /><Package className="h-3.5 w-3.5" />{status}</span></div><SheetTitle className="text-lg font-bold break-words">{product.name}</SheetTitle><SheetDescription className="font-mono text-xs break-all">{product.category} · {product.unit}</SheetDescription></SheetHeader>
    <SheetClose render={<Button variant="outline" size="icon-sm" className="absolute right-3 top-3" />}><X className="h-4 w-4" /><span className="sr-only">{t.common.close}</span></SheetClose>
    <div className="flex border-b-[3px] border-ink px-4 py-2 gap-2"><Button variant={tab === "specs" ? "default" : "outline"} size="sm" aria-pressed={tab === "specs"} onClick={() => setTab("specs")}><Info className="h-4 w-4" />{t.products.sheet.specsAndStock}</Button><Button variant={tab === "history" ? "default" : "outline"} size="sm" aria-pressed={tab === "history"} onClick={() => setTab("history")}><History className="h-4 w-4" />{c.history}</Button></div>
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
      {tab === "specs" ? <><div className="border-[3px] border-ink bg-paper p-4 space-y-2"><p className="text-xs uppercase font-bold">{t.products.sheet.inventoryLevel}</p><p className="text-3xl font-mono font-bold">{product.currentStock} <span className="text-sm">{product.unit}</span></p><p className="font-mono text-xs">{t.products.sheet.minThreshold}: {product.minStock} {product.unit}</p></div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">{values.map(([label, value]) => <div key={label} className="border-[3px] border-ink p-3"><dt className="text-xs font-bold">{label}</dt><dd className="font-mono font-bold break-words mt-1">{money(value)}</dd></div>)}</dl>
        <dl className="border-[3px] border-ink p-4 space-y-3">{[[t.products.form.supplierLabel, product.supplier], [c.shelfLocation, product.shelfLocation], [t.products.sheet.barcodeUpc, product.barcode], [t.products.form.descLabel, product.description], [t.products.sheet.registeredDate, product.createdAt], [c.metadataVersion, product.metadataVersion], [c.stockVersion, product.stockVersion]].map(([label, value]) => <div key={label}><dt className="text-xs text-ink/70">{label}</dt><dd className="text-sm break-words font-mono">{value || "—"}</dd></div>)}</dl></> : <section aria-busy={loading} className="space-y-3">
          {loading && <p role="status">{c.pending}</p>}
          {error ? <div role="alert"><p>{t.common.error}</p><Button variant="outline" onClick={() => setReload(value => value + 1)}>{c.retry}</Button></div> : !loading && history && <>
            <p className="font-mono text-xs">{c.history}: {history.total}</p>
            {history.items.length === 0 && <p>{t.products.sheet.noMovements}</p>}
            {history.items.map(event => <article key={event.id} className="border-[3px] border-ink p-3 space-y-2"><div className="flex flex-wrap justify-between gap-2"><strong className="font-mono text-xs uppercase">{kinds[event.kind] ?? event.kind}</strong><time className="font-mono text-xs" dateTime={event.recordedAt}>{new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.recordedAt))}</time></div><p className="font-mono text-xs">{c.before}: {event.quantityBefore} · {c.after}: {event.quantityAfter} {event.unitSnapshot} ({event.quantityDelta > 0 ? "+" : ""}{event.quantityDelta})</p><p className="font-mono text-xs">{c.inventoryCostValue}: {money(event.costBefore)} / {money(event.costAfter)}</p>{event.purchaseTotal !== null && <p className="font-mono text-xs">{c.purchaseTotal}: {money(event.purchaseTotal)}</p>}<p className="font-mono text-xs break-all">{c.reference}: {event.reference}</p>{event.note && <p className="text-sm break-words">{event.note}</p>}<p className="text-xs">{t.products.sheet.initiatedBy}: {event.actorDisplay}</p></article>)}
            <div className="flex justify-between gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>{c.previous}</Button><span className="font-mono self-center">{page}</span><Button variant="outline" disabled={page * history.pageSize >= history.total} onClick={() => setPage(value => value + 1)}>{c.next}</Button></div>
          </>}
        </section>}
    </div><SheetFooter className="border-t-[3px] border-ink flex-row flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!!product.archivedAt} onClick={() => onMovement?.(product, "in")}><ArrowDownToLine className="h-4 w-4" />{t.products.sheet.stockIn}</Button><Button size="sm" variant="outline" disabled={!!product.archivedAt || product.currentStock === 0} onClick={() => onMovement?.(product, "out")}><ArrowUpFromLine className="h-4 w-4" />{c.sold}</Button><Button size="sm" disabled={!!product.archivedAt} onClick={() => onEdit?.(product)}><Edit2 className="h-4 w-4" />{t.products.sheet.editItem}</Button>{onLifecycle && <Button size="sm" variant="outline" onClick={() => onLifecycle(product)}><Archive className="h-4 w-4" />{product.archivedAt ? c.reactivate : c.archive}</Button>}</SheetFooter>
  </SheetContent></Sheet>;
}
