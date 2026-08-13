"use client";

import * as React from "react";
import { Save, RotateCcw, CheckCircle2, AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";

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
  const { language, t } = useI18n();

  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(updatedAt);
      return d.toLocaleTimeString(language === "id" ? "id-ID" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "08:00:00";
    }
  }, [updatedAt, language]);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-black bg-[#543afd] text-white shadow-neo shrink-0">
            <Settings className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {t.settings.title}
              </h1>
              <Badge
                variant="outline"
                className="border-black bg-muted font-mono text-[13px] uppercase tracking-wider text-foreground shadow-neo-sm"
              >
                {t.settings.badgeText}
              </Badge>
              {hasUnsavedChanges && (
                <Badge className="animate-pulse border-black bg-amber-400 font-mono text-[13px] uppercase tracking-wider text-black shadow-neo-sm">
                  <AlertCircle className="mr-1 h-3.5 w-3.5" />{" "}
                  {language === "id" ? "Ada Perubahan Belum Disimpan" : "Unsaved Changes"}
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
              {t.settings.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetModalOpen}
            className="h-9 border-black font-mono text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 active:translate-y-px"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />{" "}
            {language === "id" ? "Reset Data & Standar" : "Reset System Data"}
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className="h-9 border-1.5 border-black bg-[#543afd] font-mono text-xs font-bold text-white shadow-neo-sm hover:bg-[#462ee0] active:translate-y-px disabled:opacity-50 disabled:shadow-none"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> {t.settings.saveChanges}
          </Button>
        </div>
      </div>

      {/* Meta feedback bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-slate-100/70 px-3.5 py-2 font-mono text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            {language === "id" ? "Terakhir Diperbarui:" : "Last Updated:"}
          </span>
          <span className="font-semibold text-slate-900" suppressHydrationWarning>
            {formattedDate}
          </span>
        </div>

        {lastSavedMessage ? (
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{lastSavedMessage}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">
            {language === "id"
              ? "Mode Pengembangan: Data tersimpan secara otomatis di browser lokal"
              : "Development Mode: Data persisted locally in browser state"}
          </span>
        )}
      </div>
    </div>
  );
}
