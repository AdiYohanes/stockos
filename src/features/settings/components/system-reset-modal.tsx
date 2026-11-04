"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface SystemResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
  isPending?: boolean;
  children?: React.ReactNode;
}

export function SystemResetModal({
  isOpen,
  onClose,
  onConfirmReset,
  isPending = false,
  children,
}: SystemResetModalProps) {
  const { t } = useI18n();
  const [confirmText, setConfirmText] = React.useState("");

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === "RESET";

  const handleReset = () => {
    if (!isConfirmed || isPending) return;
    onConfirmReset();
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={open => { if (!open && !isPending) onClose(); }}>
      <DialogPortal><DialogBackdrop />
      <DialogPopup className="max-w-md rounded-none border-[3px] border-ink bg-white shadow-hard-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-ink bg-status-warning/15 px-5 py-4">
          <div className="flex items-center gap-2 text-ink">
            <ShieldAlert className="h-5 w-5 text-status-warning shrink-0" />
            <DialogTitle className="font-heading text-base font-bold uppercase tracking-wide text-ink">{t.settings.resetTitle}</DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.cancel}
            disabled={isPending}
            className="rounded-none border-[1.5px] border-ink p-1 text-ink hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <DialogDescription className="text-xs text-ink/70 leading-relaxed">{t.settings.resetWarningDesc}</DialogDescription>

          <div className="rounded-none border-[2px] border-ink bg-paper p-3.5 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs text-ink space-y-1">
              <p className="font-bold uppercase tracking-wide">Keamanan Data Operasional:</p>
              <p className="text-[11px] leading-relaxed text-ink/70">
                Data katalog produk, transaksi stok, bukti audit, dan akun pemilik tetap aman dan tidak akan dihapus.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmReset" className="text-xs font-semibold text-ink">
              {t.settings.typeConfirm}{" "}
              <span className="font-mono font-bold text-destructive">RESET</span>{" "}
              {t.settings.toConfirm}
            </Label>
            <Input
              id="confirmReset"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              disabled={isPending}
              className="h-9 rounded-none border-[3px] border-ink font-mono text-xs input-focus uppercase"
            />
          </div>
        </div>

        {children && <div className="px-5 pb-4 space-y-3">{children}</div>}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t-[3px] border-ink bg-paper px-5 py-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirmText("");
              onClose();
            }}
            disabled={isPending}
            className="h-9 border-black text-xs font-semibold"
          >
            {t.common.cancel}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleReset}
            disabled={!isConfirmed || isPending}
            className="h-9 border-[1.5px] border-black bg-destructive font-mono text-xs font-bold text-white shadow-hard-sm hover:brightness-95 disabled:opacity-40 disabled:shadow-none"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />{" "}
            {isPending ? t.products.persistent.pending : t.settings.resetSubmit}
          </Button>
        </div>
      </DialogPopup></DialogPortal>
    </DialogRoot>
  );
}
