"use client";

import * as React from "react";
import { Edit2, Plus, Tags, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/context";
import { createCategoryAction, deleteCategoryAction, listCategoriesAction, updateCategoryAction } from "../actions";
import type { CategoryDto, TaxonomyMutationResult } from "../schemas/taxonomy-rpc.schema";
import type { ProductFailure } from "@/features/products/schemas/product-rpc.schema";

function failureMessage(failure: ProductFailure, fallback: string): string {
  if (failure.code === "VALIDATION_ERROR") {
    const name = failure.fieldErrors?.name?.[0];
    return name ? `${fallback} ${name}` : fallback;
  }
  if (failure.code === "TAXONOMY_EXISTS") return failure.message;
  if (failure.code === "TAXONOMY_IN_USE") return failure.message;
  return failure.message || fallback;
}

function TaxonomyForm({
  title, label, value, pending, onChange, onSubmit, onClose, error,
}: {
  title: string; label: string; value: string; pending: boolean;
  onChange: (name: string) => void; onSubmit: () => void; onClose: () => void; error: string | null;
}) {
  const { t } = useI18n();
  return <div className="p-5 space-y-4">
    <div className="border-b-[3px] border-ink pb-3"><DialogTitle className="text-base font-bold uppercase">{title}</DialogTitle></div>
    <DialogBody className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="taxonomy-name">{label}</Label>
        <Input
          id="taxonomy-name"
          value={value}
          maxLength={120}
          autoFocus
          disabled={pending}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSubmit(); } }}
          className="h-9 rounded-none border-[3px] border-ink font-mono text-xs focus-visible:shadow-hard-sm"
        />
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>
    </DialogBody>
    <DialogFooter className="border-t-[3px] border-ink pt-3">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onClose}>{t.settings.taxonomyCancel}</Button>
      <Button type="button" size="sm" disabled={pending || value.trim().length === 0} onClick={onSubmit}>{pending ? t.products.persistent.pending : t.settings.taxonomySave}</Button>
    </DialogFooter>
  </div>;
}

export function CategoriesSettingsSection({ disabled }: { disabled?: boolean }) {
  const { t } = useI18n();
  const c = t.products.persistent;
  const [items, setItems] = React.useState<CategoryDto[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<CategoryDto | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<CategoryDto | null>(null);
  const [name, setName] = React.useState("");
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const blocked = disabled || pending;

  const reload = React.useCallback(async () => {
    React.startTransition(async () => {
      try {
        const result = await listCategoriesAction();
        if (result.ok) { setItems(result.data); setLoadError(null); }
        else setLoadError(c.errors[result.code] || t.common.error);
      } catch { setLoadError(t.common.error); }
    });
  }, [c.errors, t.common.error]);

  React.useEffect(() => { void reload(); }, [reload]);

  function closeDialogs() {
    setEditing(null); setCreating(false); setDeleting(null); setName(""); setDialogError(null); setDeleteError(null);
  }

  async function save() {
    if (pending) return;
    const trimmed = name.trim();
    if (!trimmed) { setDialogError(t.settings.taxonomyNameRequired); return; }
    setPending(true); setDialogError(null);
    const requestId = crypto.randomUUID();
    const result: TaxonomyMutationResult = editing
      ? await updateCategoryAction({ requestId, id: editing.id, name: trimmed })
      : await createCategoryAction({ requestId, name: trimmed });
    setPending(false);
    if (!result.ok) { setDialogError(failureMessage(result, t.settings.taxonomyNameRequired)); return; }
    await reload();
    closeDialogs();
  }

  async function remove() {
    if (pending || !deleting) return;
    setPending(true); setDeleteError(null);
    const result = await deleteCategoryAction({ requestId: crypto.randomUUID(), id: deleting.id });
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
              <Tags className="h-5 w-5 text-ink" /> {t.settings.categoriesTitle}
            </CardTitle>
            <CardDescription className="text-xs text-ink/60">{t.settings.categoriesSubtitle}</CardDescription>
          </div>
          <Button size="sm" disabled={blocked} onClick={() => { setEditing(null); setCreating(true); setName(""); setDialogError(null); setDeleting(null); setDeleteError(null); }}
            className="h-9 border-[1.5px] border-black bg-acid font-mono text-xs font-bold text-white shadow-hard-sm hover:bg-acid/85">
            <Plus className="mr-1 h-3.5 w-3.5" />{t.settings.addCategory}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {loadError && <p role="alert" className="text-xs text-destructive">{loadError}</p>}
        {items === null && !loadError && <p role="status" className="text-xs text-ink/60">{t.common.loading}</p>}
        {items && items.length === 0 && <p className="text-xs text-ink/60">{t.settings.categoriesSubtitle}</p>}
        {items && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-ink text-left">
                  <th className="py-2 pr-3 font-semibold uppercase tracking-wider text-ink/70">{t.settings.categoryName}</th>
                  <th className="py-2 pr-3 text-right font-semibold uppercase tracking-wider text-ink/70">{t.settings.categoryProducts}</th>
                  <th className="py-2 text-right font-semibold uppercase tracking-wider text-ink/70">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-ink/15">
                    <td className="py-2 pr-3 font-bold text-ink">{item.name}</td>
                    <td className="py-2 pr-3 text-right">
                      <Badge variant="outline" className="rounded-none border-[1.5px] border-ink font-mono text-[10px]">{item.productCount}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" disabled={blocked} aria-label={`${t.settings.editCategory}: ${item.name}`} className="h-7 border-[1.5px] border-ink px-2"
                          onClick={() => { setEditing(item); setName(item.name); setDialogError(null); setDeleting(null); setDeleteError(null); }}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={blocked} aria-label={`${t.settings.deleteCategory}: ${item.name}`} className="h-7 border-[1.5px] border-ink px-2 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => { setDeleting(item); setDeleteError(null); setEditing(null); setName(""); }}>
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

      {/* Create / edit name dialog */}
      <DialogRoot open={creating || editing !== null} onOpenChange={open => { if (!open) closeDialogs(); }}>
        <DialogPortal><DialogBackdrop />
          <DialogPopup className="max-w-sm rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
            <TaxonomyForm
              title={editing ? t.settings.editCategory : t.settings.addCategory}
              label={t.settings.categoryName}
              value={name}
              pending={pending}
              onChange={value => { setName(value); setDialogError(null); }}
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
                  {deleting.name} · {deleting.productCount} {t.settings.categoryProducts}. {t.settings.taxonomyDeleteDesc}
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
