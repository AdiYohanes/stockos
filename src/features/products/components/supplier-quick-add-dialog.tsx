"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { createSupplierAction } from "@/features/settings/actions";

interface SupplierQuickAddDialogProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onCreated: (name: string) => void;
}

// Spec story 13/18: mini dialog collects nama + no. telepon/WA + catatan before creating the supplier row.
export function SupplierQuickAddDialog({ open, initialName, onClose, onCreated }: SupplierQuickAddDialogProps) {
  const { t } = useI18n();
  const [name, setName] = React.useState(initialName);
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    if (pending) return;
    const trimmed = name.trim();
    if (!trimmed) { setError(t.settings.taxonomyNameRequired); return; }
    setPending(true);
    setError(null);
    const result = await createSupplierAction({
      requestId: crypto.randomUUID(), name: trimmed, phone: phone.trim() || null, notes: notes.trim() || null,
    });
    setPending(false);
    if (!result.ok) { setError(result.message); return; }
    onCreated(trimmed);
  }

  return (
    <DialogRoot open={open} onOpenChange={next => { if (!next && !pending) onClose(); }}>
      <DialogPortal><DialogBackdrop />
        <DialogPopup className="max-w-sm rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
          <div className="p-5 space-y-4">
            <div className="border-b-[3px] border-ink pb-3">
              <DialogTitle className="text-base font-bold uppercase">{t.settings.taxonomyQuickAddSupplierTitle}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">{t.settings.taxonomyQuickAddSupplier}</DialogDescription>
            </div>
            <DialogBody className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="quick-supplier-name">{t.settings.supplierName}</Label>
                <Input id="quick-supplier-name" value={name} maxLength={120} autoFocus disabled={pending}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void submit(); } }}
                  className="h-9 rounded-none border-[3px] border-ink font-mono text-xs focus-visible:shadow-hard-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quick-supplier-phone">{t.settings.supplierPhone}</Label>
                <Input id="quick-supplier-phone" value={phone} maxLength={40} disabled={pending} inputMode="tel"
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void submit(); } }}
                  className="h-9 rounded-none border-[3px] border-ink font-mono text-xs focus-visible:shadow-hard-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quick-supplier-notes">{t.settings.supplierNotes}</Label>
                <Input id="quick-supplier-notes" value={notes} maxLength={500} disabled={pending}
                  onChange={e => setNotes(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void submit(); } }}
                  className="h-9 rounded-none border-[3px] border-ink text-xs focus-visible:shadow-hard-sm" />
              </div>
              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
            </DialogBody>
            <DialogFooter className="border-t-[3px] border-ink pt-3">
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onClose}>{t.settings.taxonomyCancel}</Button>
              <Button type="button" size="sm" disabled={pending || name.trim().length === 0} onClick={() => { void submit(); }}>
                <Plus className="mr-1 h-3.5 w-3.5" />{pending ? t.products.persistent.pending : t.settings.taxonomySave}
              </Button>
            </DialogFooter>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
