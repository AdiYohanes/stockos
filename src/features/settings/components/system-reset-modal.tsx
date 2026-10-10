"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldAlert, RefreshCw, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface SystemResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
  isPending?: boolean;
}

export function SystemResetModal({
  isOpen,
  onClose,
  onConfirmReset,
  isPending = false,
}: SystemResetModalProps) {
  const { t } = useI18n();
  const [confirmText, setConfirmText] = React.useState("");

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === "RESET";

  const handleReset = () => {
    if (!isConfirmed || isPending) return;
    onConfirmReset();
    setConfirmText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-none border-1.5 border-black bg-white shadow-neo overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0" />
            <h2 className="font-heading text-base font-bold text-slate-900">
              Reset Standar Pengaturan Warung
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-none p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Tindakan ini akan mengembalikan profil warung, zona waktu, dan ambang batas bawaan pembuatan produk ke standar awal (Pcs, 15 unit, WIB).
          </p>

          <div className="rounded-none border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-bold">Keamanan Data Operasional:</p>
              <p className="text-[11px] leading-relaxed text-emerald-900">
                Data katalog produk, transaksi stok, bukti audit, dan akun pemilik tetap aman dan tidak akan dihapus.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmReset" className="text-xs font-semibold text-slate-700">
              {t.settings.typeConfirm}{" "}
              <span className="font-mono font-bold text-amber-700">RESET</span>{" "}
              {t.settings.toConfirm}
            </Label>
            <Input
              id="confirmReset"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              disabled={isPending}
              className="h-9 font-mono text-xs focus-visible:ring-amber-500 uppercase"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-ink bg-slate-50 px-5 py-3.5">
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
            className="h-9 border-1.5 border-black bg-amber-600 font-mono text-xs font-bold text-white shadow-neo-sm hover:bg-amber-700 disabled:opacity-40 disabled:shadow-none"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />{" "}
            {isPending ? "Mereset..." : "Reset Standar Toko"}
          </Button>
        </div>
      </div>
    </div>
  );
}
