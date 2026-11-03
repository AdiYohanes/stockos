"use client";

import * as React from "react";
import { Edit2, Phone, Plus, Trash2, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/context";
import { createSupplierAction, deleteSupplierAction, listSuppliersAction, updateSupplierAction } from "../actions";
import type { SupplierDto, TaxonomyMutationResult } from "../schemas/taxonomy-rpc.schema";

function failureMessage(failure: TaxonomyMutationResult & { ok: false }, fallback: string): string {
  if (failure.code === "VALIDATION_ERROR") {
    const name = failure.fieldErrors?.name?.[0] ?? failure.fieldErrors?.phone?.[0] ?? failure.fieldErrors?.notes?.[0];
    return name ? `${fallback} ${name}` : fallback;
  }
  return failure.message || fallback;
}

function SupplierForm({
  title, name, phone, notes, pending, onChange, onSubmit, onClose, error,
}: {
  title: string; name: string; phone: string; notes: string; pending: boolean;
  onChange: (patch: { name?: string; phone?: string; notes?: string }) => void;
  onSubmit: () => void; onClose: () => void; error: string | null;
}) {
  const { t } = useI18n();
  return <div className="p-5 space-y-4">
    <div className="border-b-[3px] border-ink pb-3"><DialogTitle className="text-base font-bold uppercase">{title}</DialogTitle></div>
    <DialogBody className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="supplier-name">{t.settings.supplierName}</Label>
        <Input id="supplier-name" value={name} maxLength={120} autoFocus disabled={pending}
          onChange={e => onChange({ name: e.target.value })}
          className="h-9 rounded-none border-[3px] border-ink font-mono text-xs focus-visible:shadow-hard-sm" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="supplier-phone">{t.settings.supplierPhone}</Label>
        <Input id="supplier-phone" value={phone} maxLength={40} disabled={pending} inputMode="tel"
          onChange={e => onChange({ phone: e.target.value })}
          className="h-9 rounded-none border-[3px] border-ink font-mono text-xs focus-visible:shadow-hard-sm" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="supplier-notes">{t.settings.supplierNotes}</Label>
        <Input id="supplier-notes" value={notes} maxLength={500} disabled={pending}
          onChange={e => onChange({ notes: e.target.value })}
          className="h-9 rounded-none border-[3px] border-ink text-xs focus-visible:shadow-hard-sm" />
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </DialogBody>
    <DialogFooter className="border-t-[3px] border-ink pt-3">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onClose}>{t.settings.taxonomyCancel}</Button>
      <Button type="button" size="sm" disabled={pending || name.trim().length === 0} onClick={onSubmit}>
        {pending ? t.products.persistent.pending : t.settings.taxonomySave}
      </Button>
    </DialogFooter>
  </div>;
}

export function SuppliersSettingsSection({ disabled }: { disabled?: boolean }) {
  const { t } = useI18n();
  const c = t.products.persistent;
  const [items, setItems] = React.useState<SupplierDto[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<SupplierDto | null>(null);
  const [deleting, setDeleting] = React.useState<SupplierDto | null>(null);
  const [draft, setDraft] = React.useState({ name: "", phone: "", notes: "" });
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const blocked = disabled || pending;

  const reload = React.useCallback(async () => {
    React.startTransition(async () => {
      try {
        const result = await listSuppliersAction();
        if (result.ok) { setItems(result.data); setLoadError(null); }
        else setLoadError(c.errors[result.code] || t.common.error);
      } catch { setLoadError(t.common.error); }
    });
  }, [c.errors, t.common.error]);

  React.useEffect(() => { void reload(); }, [reload]);

  function closeDialogs() {
    setEditing(null); setCreating(false); setDeleting(null);
    setDraft({ name: "", phone: "", notes: "" });
    setDialogError(null); setDeleteError(null);
  }

  function openCreate() {
    setEditing(null); setCreating(true); setDraft({ name: "", phone: "", notes: "" });
    setDialogError(null); setDeleting(null); setDeleteError(null);
  }

  function openEdit(item: SupplierDto) {
    setDeleting(null); setDeleteError(null);
    setEditing(item);
    setDraft({ name: item.name, phone: item.phone ?? "", notes: item.notes ?? "" });
    setDialogError(null);
  }

  async function save() {
    if (pending) return;
    const trimmed = draft.name.trim();
    if (!trimmed) { setDialogError(t.settings.taxonomyNameRequired); return; }
    const phone = draft.phone.trim();
    const notes = draft.notes.trim();
    setPending(true); setDialogError(null);
    const requestId = crypto.randomUUID();
    const result: TaxonomyMutationResult = editing
      ? await updateSupplierAction({ requestId, id: editing.id, name: trimmed, phone: phone || null, notes: notes || null })
      : await createSupplierAction({ requestId, name: trimmed, phone: phone || null, notes: notes || null });
    setPending(false);
    if (!result.ok) { setDialogError(failureMessage(result, t.settings.taxonomyNameRequired)); return; }
    await reload();
    closeDialogs();
  }

  async function remove() {
    if (pending || !deleting) return;
    setPending(true); setDeleteError(null);
    const result = await deleteSupplierAction({ requestId: crypto.randomUUID(), id: deleting.id });
    setPending(false);
    if (!result.ok) { setDeleteError(failureMessage(result, t.settings.taxonomyDeleteBlocked)); return; }
    await reload();
    closeDialogs();
  }

  return (
    <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
      <CardHeader className="border-b-[3px] border-ink pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
              <Truck className="h-5 w-5 text-ink" /> {t.settings.suppliersTitle}
            </CardTitle>
            <CardDescription className="text-xs text-ink/60">{t.settings.suppliersSubtitle}</CardDescription>
          </div>
          <Button size="sm" disabled={blocked} onClick={openCreate}
            className="h-9 border-[1.5px] border-black bg-acid font-mono text-xs font-bold text-white shadow-hard-sm hover:bg-acid/85">
            <Plus className="mr-1 h-3.5 w-3.5" />{t.settings.addSupplier}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {loadError && <p role="alert" className="text-xs text-destructive">{loadError}</p>}
        {items === null && !loadError && <p role="status" className="text-xs text-ink/60">{t.common.loading}</p>}
        {items && items.length === 0 && <p className="text-xs text-ink/60">{t.settings.suppliersSubtitle}</p>}
        {items && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-ink text-left">
                  <th className="py-2 pr-3 font-semibold uppercase tracking-wider text-ink/70">{t.settings.supplierName}</th>
                  <th className="py-2 pr-3 font-semibold uppercase tracking-wider text-ink/70">{t.settings.supplierPhone}</th>
                  <th className="py-2 pr-3 text-right font-semibold uppercase tracking-wider text-ink/70">{t.settings.supplierProducts}</th>
                  <th className="py-2 text-right font-semibold uppercase tracking-wider text-ink/70">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-ink/15">
                    <td className="py-2 pr-3 font-bold text-ink">{item.name}</td>
                    <td className="py-2 pr-3 font-mono text-ink/80">
                      {item.phone ? (
                        <a href={`https://wa.me/${item.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 underline decoration-ink/30 underline-offset-4 hover:bg-paper hover:decoration-acid">
                          <Phone className="h-3 w-3 text-ink/50" />{item.phone}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Badge variant="outline" className="rounded-none border-[1.5px] border-ink font-mono text-[10px]">{item.productCount}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" disabled={blocked} aria-label={`${t.settings.editSupplier}: ${item.name}`} className="h-7 border-[1.5px] border-ink px-2" onClick={() => openEdit(item)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={blocked} aria-label={`${t.settings.deleteSupplier}: ${item.name}`} className="h-7 border-[1.5px] border-ink px-2 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => { setDeleting(item); setDeleteError(null); setEditing(null); setCreating(false); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Create / edit dialog */}
      <DialogRoot open={creating || editing !== null} onOpenChange={open => { if (!open) closeDialogs(); }}>
        <DialogPortal><DialogBackdrop />
          <DialogPopup className="max-w-sm rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
            <SupplierForm
              title={editing ? t.settings.editSupplier : t.settings.addSupplier}
              name={draft.name} phone={draft.phone} notes={draft.notes}
              pending={pending}
              onChange={patch => { setDraft(previous => ({ ...previous, ...patch })); setDialogError(null); }}
              onSubmit={save}
              onClose={closeDialogs}
              error={dialogError}
            />
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>

      {/* Delete confirm dialog */}
      <DialogRoot open={deleting !== null} onOpenChange={open => { if (!open) closeDialogs(); }}>
        <DialogPortal><DialogBackdrop />
          <DialogPopup className="max-w-sm rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
            <div className="p-5 space-y-4">
              <div className="border-b-[3px] border-ink pb-3"><DialogTitle className="text-base font-bold uppercase">{t.settings.taxonomyDeleteTitle}</DialogTitle></div>
              <DialogBody className="space-y-3">
                {deleting && <DialogDescription className="text-xs">
                  {deleting.name} · {deleting.productCount} {t.settings.supplierProducts}. {t.settings.taxonomyDeleteDesc}
                </DialogDescription>}
                {deleteError && <p role="alert" className="text-xs text-destructive">{deleteError}</p>}
              </DialogBody>
              <DialogFooter className="border-t-[3px] border-ink pt-3">
                <Button type="button" variant="outline" size="sm" disabled={pending} onClick={closeDialogs}>{t.settings.taxonomyCancel}</Button>
                <Button type="button" size="sm" disabled={pending}
                  className="border-[1.5px] border-black bg-destructive font-mono text-xs font-bold text-white shadow-hard-sm hover:brightness-95"
                  onClick={remove}>{pending ? t.products.persistent.pending : t.settings.taxonomyDeleteConfirm}</Button>
              </DialogFooter>
            </div>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </Card>
  );
}
