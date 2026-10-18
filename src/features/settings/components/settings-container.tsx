"use client";

import * as React from "react";
import {
  SettingsHeader,
  SettingsTabNav,
  CompanySettingsForm,
  InventorySettingsForm,
  SystemResetModal,
  SettingsTab,
  type ShopSettingsDto,
  type CompanySettings,
  type InventorySettings,
} from "@/features/settings";
import { getShopSettingsAction, updateShopSettingsAction } from "@/features/settings/actions";
import type { SettingsMutationResult, UpdateShopSettingsInput } from "../schemas/settings-rpc.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, ShieldCheck, Activity, Database, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface SettingsContainerProps {
  initialSettings: ShopSettingsDto;
  ownerEmail?: string;
}

type SettingsDraft = CompanySettings & InventorySettings;
function settingsDraft(settings: ShopSettingsDto): SettingsDraft {
  return { name: settings.name, ownerName: settings.ownerName, phone: settings.phone ?? "", address: settings.address ?? "",
    timezone: settings.timezone, defaultUnit: settings.defaultUnit, defaultMinStock: settings.defaultMinStock };
}
function sameDraft(left: SettingsDraft, right: SettingsDraft) {
  return (Object.keys(left) as (keyof SettingsDraft)[]).every(key => Object.is(left[key], right[key]));
}

function settingsSnapshotMode(incomingVersion: string, baselineVersion: string, blocked: boolean, dirty: boolean, conflict: boolean) {
  if (BigInt(incomingVersion) <= BigInt(baselineVersion)) return "ignore";
  return blocked || dirty || conflict ? "review" : "load";
}

function canReviewSettings(currentVersion: string, newestVersion: string, blocked: boolean, running: boolean) {
  return !blocked && !running && BigInt(currentVersion) >= BigInt(newestVersion);
}

export function SettingsContainer({
  initialSettings,
  ownerEmail,
}: SettingsContainerProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("company");
  const [isResetModalOpen, setIsResetModalOpen] = React.useState(false);

  const p = t.products.persistent;
  const [baseline, setBaseline] = React.useState(initialSettings);
  const [draft, setDraft] = React.useState(() => settingsDraft(initialSettings));
  const [expectedVersion, setExpectedVersion] = React.useState(initialSettings.version);
  const [current, setCurrent] = React.useState<ShopSettingsDto | null>(null);
  const [conflict, setConflict] = React.useState(false);
  const [seenVersion, setSeenVersion] = React.useState(initialSettings.version);
  const [pending, setPending] = React.useState(false);
  const [uncertain, setUncertain] = React.useState(false);
  const [refreshFailed, setRefreshFailed] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const running = React.useRef(false);
  const request = React.useRef<Readonly<{ payload: UpdateShopSettingsInput; intent: "save" | "reset" }> | null>(null);
  const committed = React.useRef<ShopSettingsDto | null>(null);
  const unresolved = React.useRef(false);
  const newestVersion = React.useRef(initialSettings.version);
  React.useLayoutEffect(() => {
    for (const version of [initialSettings.version, baseline.version, current?.version]) {
      if (version && BigInt(version) > BigInt(newestVersion.current)) newestVersion.current = version;
    }
  }, [initialSettings.version, baseline.version, current?.version]);
  const blocked = pending || uncertain || refreshFailed;
  const hasUnsavedChanges = !sameDraft(draft, settingsDraft(baseline));
  const currentVersion = expectedVersion;
  const updatedAt = baseline.updatedAt;

  if (BigInt(initialSettings.version) > BigInt(seenVersion)) {
    setSeenVersion(initialSettings.version);
    const mode = settingsSnapshotMode(initialSettings.version, baseline.version, blocked, hasUnsavedChanges, conflict);
    if (mode !== "ignore") {
      if (mode === "review") {
        setCurrent(previous => !previous || BigInt(initialSettings.version) > BigInt(previous.version) ? initialSettings : previous);
        if (!blocked) setConflict(true);
      } else {
        setBaseline(initialSettings);
        setDraft(settingsDraft(initialSettings));
        setExpectedVersion(initialSettings.version);
      }
    }
  }

  if (!blocked && !conflict && current && BigInt(current.version) > BigInt(expectedVersion)) setConflict(true);

  function changeDraft(updated: Partial<SettingsDraft>) {
    if (blocked || running.current) return;
    setDraft(previous => ({ ...previous, ...updated }));
    setSaveMessage(null);
    setErrorMessage(null);
  }

  async function readCurrent() {
    const result = await getShopSettingsAction();
    if (!result.ok) throw new Error(p.errors[result.code] || t.common.error);
    if (BigInt(result.data.version) < BigInt(newestVersion.current)) throw new Error(p.refreshError);
    newestVersion.current = result.data.version;
    return result.data;
  }

  async function reloadConflict() {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setErrorMessage(null);
    try {
      const latest = await readCurrent();
      setCurrent(previous => !previous || BigInt(latest.version) >= BigInt(previous.version) ? latest : previous);
    } catch { setErrorMessage(t.common.error); }
    finally { running.current = false; setPending(false); }
  }

  function review(load: boolean) {
    if (!current || !canReviewSettings(current.version, newestVersion.current, blocked, running.current)) return;
    setBaseline(current);
    setExpectedVersion(current.version);
    if (load) setDraft(settingsDraft(current));
    setCurrent(null);
    setConflict(false);
    setErrorMessage(null);
    setSaveMessage(null);
  }

  async function execute(intent?: "save" | "reset") {
    if (running.current || (intent && (blocked || conflict))) return;
    running.current = true;
    setPending(true);
    setErrorMessage(null);
    setSaveMessage(null);
    try {
      if (!committed.current) {
        if (!request.current) {
          if (!intent) return;
          const fields = intent === "reset" ? { name: baseline.name, ownerName: baseline.ownerName,
            phone: baseline.phone, address: baseline.address, timezone: baseline.timezone, defaultUnit: "Pcs", defaultMinStock: 15 } : {
            name: draft.name.trim(), ownerName: draft.ownerName.trim(), phone: draft.phone.trim() || null,
            address: draft.address.trim() || null, timezone: draft.timezone,
            defaultUnit: draft.defaultUnit.trim(), defaultMinStock: draft.defaultMinStock };
          request.current = Object.freeze({ intent, payload: Object.freeze({ ...fields, requestId: crypto.randomUUID(), expectedVersion }) });
        }
        let result: SettingsMutationResult;
        try { result = await updateShopSettingsAction(request.current.payload); }
        catch {
          unresolved.current = true;
          setUncertain(true);
          setErrorMessage(p.uncertain);
          return;
        }
        if (!result.ok) {
          if (unresolved.current || result.code === "INTERNAL_ERROR") {
            unresolved.current = true;
            setUncertain(true);
            setErrorMessage(p.uncertain);
            return;
          }
          request.current = null;
          setUncertain(false);
          setErrorMessage(p.errors[result.code] || t.common.error);
          if (result.code === "VERSION_CONFLICT") {
            setConflict(true);
            setCurrent(null);
            try { setCurrent(await readCurrent()); }
            catch { setErrorMessage(t.common.error); }
          }
          return;
        }
        committed.current = result.data.settings;
        unresolved.current = false;
        setUncertain(false);
      }
      try {
        const latest = await readCurrent();
        if (BigInt(latest.version) < BigInt(committed.current.version) || BigInt(latest.version) < BigInt(newestVersion.current)) throw new Error(p.refreshError);
        const saved = request.current?.intent;
        setBaseline(latest);
        setExpectedVersion(latest.version);
        setDraft(previous => saved === "reset" ? { ...previous, defaultUnit: latest.defaultUnit, defaultMinStock: latest.defaultMinStock } : settingsDraft(latest));
        setCurrent(null);
        setConflict(false);
        setRefreshFailed(false);
        setSaveMessage(saved === "reset" ? t.settings.resetSaved : t.settings.settingsSaved);
        if (saved === "reset") setIsResetModalOpen(false);
        request.current = null;
        committed.current = null;
      } catch {
        setRefreshFailed(true);
        setErrorMessage(p.refreshError);
      }
    } finally { running.current = false; setPending(false); }
  }

  const handleSave = () => React.startTransition(() => { void execute("save"); });
  const handleConfirmReset = () => React.startTransition(() => { void execute("reset"); });

  const feedback = <>
    {conflict && <div role="alert" className="border-[3px] border-amber-600 bg-amber-50 p-4 text-amber-950 rounded-none shadow-hard-sm space-y-3">
      <p className="text-sm">{t.settings.persistentConflict}</p>
      {current && <dl id="settings-current" className="font-mono text-xs space-y-1 break-words">
        <dt>{p.reviewCurrent} · Rev {current.version}</dt>
        <dd>{current.name} · {current.ownerName}</dd><dd>{current.phone} · {current.address}</dd>
        <dd>{current.timezone} · {current.defaultUnit} · {current.defaultMinStock}</dd>
      </dl>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={blocked} onClick={() => React.startTransition(() => { void reloadConflict(); })}>{p.reviewCurrent}</Button>
        <Button type="button" disabled={blocked || !current} onClick={() => review(false)}>{p.reviewed}</Button>
        <Button type="button" variant="outline" disabled={blocked || !current} onClick={() => review(true)}>{t.settings.loadCurrent}</Button>
      </div>
    </div>}
    {errorMessage && <div role="alert" className="border-[3px] border-red-600 bg-red-50 p-4 text-red-950 rounded-none shadow-hard-sm flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
      <div className="space-y-1"><h4 className="font-bold text-sm">{t.common.error}</h4><p className="text-xs leading-relaxed">{errorMessage}</p></div>
    </div>}
    {(uncertain || refreshFailed) && <Button type="button" disabled={pending} onClick={() => React.startTransition(() => { void execute(); })}>{p.retry}</Button>}
    {pending && <p role="status">{p.pending}</p>}
  </>;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <SettingsHeader
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedMessage={saveMessage}
        updatedAt={updatedAt}
        timezone={baseline.timezone}
        version={currentVersion}
        isSaving={pending}
        disabled={blocked || conflict}
        onSave={handleSave}
        onResetModalOpen={() => { if (!blocked && !conflict && !running.current) setIsResetModalOpen(true); }}
      />

      {!isResetModalOpen && feedback}

      {/* Tab Navigation */}
      <SettingsTabNav
        activeTab={activeTab}
        disabled={blocked}
        onTabChange={tab => { if (!blocked && !running.current) setActiveTab(tab); }}
      />

      {/* Main Tab Content */}
      <div className="pt-2">
        {activeTab === "company" && (
          <CompanySettingsForm
            values={draft}
            disabled={blocked}
            ownerEmail={ownerEmail}
            onChange={changeDraft}
          />
        )}

        {activeTab === "inventory" && (
          <InventorySettingsForm
            values={draft}
            disabled={blocked}
            onChange={changeDraft}
          />
        )}

        {activeTab === "system" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
              <CardHeader className="border-b-[3px] border-ink pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
                  <Server className="h-5 w-5 text-[#543afd]" /> Status Lingkungan Operasional
                </CardTitle>
                <CardDescription className="text-xs text-ink/60">
                  Spesifikasi arsitektur backend persisten dan kontrak transaksi database.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Arsitektur Backend:</span>
                  <Badge className="border-black bg-emerald-100 text-emerald-900 font-bold uppercase tracking-wider text-[11px]">
                    Backend Foundation — Ticket 6
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Penyimpanan Entitas:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-[#543afd]" /> PostgreSQL (stockos_private)
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Versi Pengaturan:</span>
                  <span className="font-bold text-slate-800">
                    Revisi {currentVersion} (Monotonik)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Audit Trail:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> administrative_events
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
              <CardHeader className="border-b-[3px] border-ink pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
                  <Activity className="h-5 w-5 text-[#543afd]" /> Garansi Lingkup Warung
                </CardTitle>
                <CardDescription className="text-xs text-ink/60">
                  Batasan teknis kepatuhan spesifikasi StockOS untuk satu toko kecil.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Model Kepemilikan:</span>
                  <span className="font-bold text-slate-900">1 Pemilik Terverifikasi</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Modul Staf / Tim:</span>
                  <span className="font-bold text-slate-600">Ditiadakan (Di Luar Cakupan)</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Simulasi Notifikasi:</span>
                  <span className="font-bold text-slate-600">Ditiadakan (Di Luar Cakupan)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reset Pabrik:</span>
                  <span className="font-bold text-emerald-700">Aman (Tidak Menghapus Data Stok)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* System Reset Modal */}
      <SystemResetModal
        isOpen={isResetModalOpen}
        key={String(isResetModalOpen)}
        isPending={blocked || conflict}
        onClose={() => { if (!blocked && !running.current) setIsResetModalOpen(false); }}
        onConfirmReset={handleConfirmReset}
      >{feedback}</SystemResetModal>
    </div>
  );
}
