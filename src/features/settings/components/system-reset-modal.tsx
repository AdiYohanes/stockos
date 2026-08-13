"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldAlert, RefreshCw, X } from "lucide-react";

interface SystemResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export function SystemResetModal({
  isOpen,
  onClose,
  onConfirmReset,
}: SystemResetModalProps) {
  const [confirmText, setConfirmText] = React.useState("");

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === "RESET";

  const handleReset = () => {
    if (!isConfirmed) return;
    onConfirmReset();
    setConfirmText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-lg border-1.5 border-black bg-white shadow-neo overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-red-50 px-5 py-4">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            <h2 className="font-heading text-base font-bold text-slate-900">
              Reset Pengaturan & Data Standar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Tindakan ini akan mengembalikan seluruh konfigurasi profil usaha, ambang batas stok, aturan notifikasi, dan daftar tim ke pengaturan awal (Factory Reset).
          </p>

          <div className="rounded-md border border-red-200 bg-red-50 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900 space-y-1">
              <p className="font-bold">Peringatan Bahaya:</p>
              <p className="text-[11px] leading-relaxed text-red-800">
                Seluruh pengaturan yang Anda ubah di penyimpanan browser lokal akan dihapus secara permanen.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmReset" className="text-xs font-semibold text-slate-700">
              Ketik <span className="font-mono font-bold text-red-600">RESET</span> untuk mengonfirmasi:
            </Label>
            <Input
              id="confirmReset"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="h-9 font-mono text-xs focus-visible:ring-red-500 uppercase"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border bg-slate-50 px-5 py-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirmText("");
              onClose();
            }}
            className="h-9 border-black text-xs font-semibold"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleReset}
            disabled={!isConfirmed}
            className="h-9 border-1.5 border-black bg-red-600 font-mono text-xs font-bold text-white shadow-neo-sm hover:bg-red-700 disabled:opacity-40 disabled:shadow-none"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reset Seluruh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
