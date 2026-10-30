"use client";

import * as React from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { archiveProductAction, deleteProductAction, reactivateProductAction } from "../actions";
import type { ProductDto } from "../schemas/product-rpc.schema";
import { useProductSubmission, type OnProductCommitted } from "../hooks/use-product-submission";

interface DeleteProductDialogProps {
  product: ProductDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommitted: OnProductCommitted;
  permanent?: boolean;
}

function LifecycleForm({ product, onClose, onCommitted, onBlocked, permanent }: { product: ProductDto; onClose: () => void; onCommitted: OnProductCommitted; onBlocked: (blocked: boolean) => void; permanent: boolean }) {
  const { t } = useI18n();
  const c = t.products.persistent;
  const [reviewed, setReviewed] = React.useState(product);
  const archived = !!reviewed.archivedAt;
  const ineligible = permanent ? reviewed.currentStock !== 0 || BigInt(reviewed.stockVersion) !== BigInt(0) : !archived && reviewed.currentStock !== 0;
  const label = permanent ? c.deletePermanently : archived ? c.reactivate : c.archive;
  const submission = useProductSubmission(permanent ? deleteProductAction : archived ? reactivateProductAction : archiveProductAction, async value => { await onCommitted(value); onClose(); });
  React.useEffect(() => { onBlocked(submission.blocked); return () => onBlocked(false); }, [submission.blocked, onBlocked]);
  function submit() {
    if (submission.blocked || submission.code === "VERSION_CONFLICT" || ineligible) return;
    submission.submit({ productId: product.id, expectedMetadataVersion: reviewed.metadataVersion, ...(archived && !permanent ? {} : { expectedStockVersion: reviewed.stockVersion }) });
  }
  return <><div className="px-5 py-4 border-b-[3px] border-ink"><DialogTitle className="text-lg font-bold uppercase flex gap-3 items-center">{permanent ? <Trash2 className="h-5 w-5" /> : archived ? <ArchiveRestore className="h-5 w-5" /> : <Archive className="h-5 w-5" />}{label}</DialogTitle><DialogDescription className="text-xs font-mono mt-1">{permanent ? c.deleteHelp : c.archiveHelp}</DialogDescription></div>
    <DialogBody>{submission.error && <p role="alert" className="text-sm text-destructive">{submission.error}</p>}<div className="border-[3px] border-ink bg-paper p-4 shadow-hard-sm space-y-2"><p className="font-bold break-words">{reviewed.name}</p><p className="font-mono text-xs">{reviewed.sku} · {t.products.deleteDialog.currentStock}: {reviewed.currentStock} {reviewed.unit}</p></div>
      {ineligible && <p role="status" className="text-sm text-destructive">{permanent ? c.deleteUnavailable : c.zeroStockRequired}</p>}
      {submission.code === "VERSION_CONFLICT" && <section className="border-[3px] border-ink p-3 space-y-2"><p>{c.conflict}</p>{submission.current ? <><p className="font-mono text-xs">{c.currentState}: {submission.current.name} · {submission.current.sku} · {submission.current.currentStock} {submission.current.unit}</p><p className="font-mono text-xs">{c.metadataVersion}: {submission.current.metadataVersion} · {c.stockVersion}: {submission.current.stockVersion} · {submission.current.archivedAt ? c.archived : c.create}</p><Button type="button" variant="outline" onClick={() => { setReviewed(submission.current!); submission.review(); }}>{c.reviewed}</Button></> : <><p>{c.reviewCurrent}</p><Button type="button" variant="outline" onClick={submission.reloadCurrent}>{c.retry}</Button></>}</section>}
    </DialogBody><DialogFooter className="border-t-[3px] border-ink"><Button type="button" variant="outline" disabled={submission.blocked} onClick={onClose}>{t.common.cancel}</Button>{submission.uncertain || submission.refreshFailed ? <Button type="button" disabled={submission.pending} onClick={submission.retry}>{c.retry}</Button> : <Button type="button" variant={permanent ? "destructive" : "default"} onClick={submit} disabled={submission.pending || submission.code === "VERSION_CONFLICT" || ineligible}>{submission.pending ? c.pending : label}</Button>}</DialogFooter></>;
}

export function DeleteProductDialog({ product, open, onOpenChange, onCommitted, permanent = false }: DeleteProductDialogProps) {
  const [blocked, setBlocked] = React.useState(false);
  if (!product) return null;
  return <DialogRoot open={open} onOpenChange={next => { if (next || !blocked) onOpenChange(next); }}><DialogPortal><DialogBackdrop /><DialogPopup className="max-w-md overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg"><LifecycleForm key={`${product.id}:${permanent}`} permanent={permanent} product={product} onClose={() => onOpenChange(false)} onCommitted={onCommitted} onBlocked={setBlocked} /></DialogPopup></DialogPortal></DialogRoot>;
}
