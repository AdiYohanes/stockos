"use client";

import * as React from "react";
import { Save, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SettingsHeaderProps {
  hasUnsavedChanges: boolean;
  lastSavedMessage: string | null;
  updatedAt: string;
  onSave: () => void;
  onResetModalOpen: () => void;
}

export function SettingsHeader({
  hasUnsavedChanges,
  lastSavedMessage,
  updatedAt,
  onSave,
  onResetModalOpen,
}: SettingsHeaderProps) {
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(updatedAt);
      return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "08:00:00";
    }
  }, [updatedAt]);

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white pb-6 pt-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Pengaturan Sistem
            </h1>
            <Badge
              variant="outline"
              className="border-black bg-slate-100 font-mono text-[10px] uppercase tracking-wider text-slate-800"
            >
              System Config
            </Badge>
            {hasUnsavedChanges && (
              <Badge className="animate-pulse border-black bg-amber-400 font-mono text-[10px] uppercase tracking-wider text-black shadow-neo-sm">
                <AlertCircle className="mr-1 h-3 w-3" /> Ada Perubahan Belum
                Disimpan
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Kelola profil usaha, ambang batas stok, aturan valuasi inventaris,
            notifikasi, dan akses peranan tim.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetModalOpen}
            className="h-9 border-black font-mono text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 active:translate-y-px"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Data & Standar
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className="h-9 border-1.5 border-black bg-[#543afd] font-mono text-xs font-bold text-white shadow-neo-sm hover:bg-[#462ee0] active:translate-y-px disabled:opacity-50 disabled:shadow-none"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Meta feedback bar */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Terakhir Diperbarui:</span>
          <span className="font-semibold text-slate-900">
            {formattedDate} WIB
          </span>
        </div>

        {lastSavedMessage ? (
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{lastSavedMessage}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">
            Mode Pengembangan: Data tersimpan secara otomatis di browser lokal
          </span>
        )}
      </div>
    </div>
  );
}
