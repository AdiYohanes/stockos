"use client";

import * as React from "react";
import { Save, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { TimezoneCode } from "../types";

interface SettingsHeaderProps {
  hasUnsavedChanges: boolean;
  lastSavedMessage: string | null;
  updatedAt: string;
  version: string;
  timezone: TimezoneCode;
  isSaving?: boolean;
  disabled?: boolean;
  onSave: () => void;
  onResetModalOpen: () => void;
}

export function SettingsHeader({
  hasUnsavedChanges,
  lastSavedMessage,
  updatedAt,
  version,
  timezone,
  isSaving = false,
  disabled = false,
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
        timeZone: timezone,
      });
    } catch {
      return "—";
    }
  }, [updatedAt, language, timezone]);

  return (
    <div className="flex flex-col gap-5 border-b-[3px] border-ink pb-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-ink/50 mb-2">
            {t.nav.platform} / {t.nav.settings}
          </p>
          <h1 className="font-heading font-[900] uppercase tracking-tighter text-4xl md:text-5xl leading-[.9]">
            {t.settings.title}{" "}
            <span className="bg-acid px-2 mt-1 xl:mt-0 inline-block w-fit">
              {t.settings.badgeText}
            </span>
          </h1>
          {hasUnsavedChanges && (
            <span className="mt-3 inline-flex items-center animate-pulse border-[1.5px] border-ink bg-status-warning px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-hard-sm">
              <AlertCircle className="mr-1 h-3 w-3" />
              {t.settings.unsavedChanges}
            </span>
          )}
          <p className="text-sm text-ink/60 mt-2 max-w-prose">
            {t.settings.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onResetModalOpen}
            disabled={disabled || isSaving}
            className="press inline-flex h-10 items-center justify-center gap-2 border-[3px] border-ink bg-white px-4 font-display font-bold uppercase text-xs text-ink shadow-hard-sm hover:bg-paper disabled:opacity-50 disabled:shadow-none"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t.settings.resetSystemData}
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!hasUnsavedChanges || disabled || isSaving}
            className="press inline-flex h-10 items-center justify-center gap-2 border-[3px] border-ink bg-acid px-5 font-display font-[900] uppercase text-xs text-ink shadow-hard hover:brightness-105 disabled:opacity-50 disabled:shadow-none"
          >
            <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? t.products.persistent.pending : t.settings.saveChanges}
          </button>
        </div>
      </div>

      {/* Meta feedback bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-ink bg-paper px-3.5 py-2 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wider text-ink/60">
            {t.settings.lastUpdated}
          </span>
          <span className="font-bold tabular-nums text-ink">
            {formattedDate}
          </span>
          <span aria-hidden="true" className="text-ink/30">·</span>
          <span className="font-bold tabular-nums text-ink">
            v{version}
          </span>
        </div>

        {lastSavedMessage && (
          <div role="status" className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-ink">
            <CheckCircle2 className="h-4 w-4 text-status-healthy" />
            <span>{lastSavedMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
