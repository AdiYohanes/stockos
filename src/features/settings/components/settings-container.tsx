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
import { updateShopSettingsAction } from "@/features/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, ShieldCheck, Activity, Database, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface SettingsContainerProps {
  initialSettings: ShopSettingsDto;
  ownerEmail?: string;
}

export function SettingsContainer({
  initialSettings,
  ownerEmail,
}: SettingsContainerProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("company");
  const [isResetModalOpen, setIsResetModalOpen] = React.useState(false);

  const [currentVersion, setCurrentVersion] = React.useState(initialSettings.version);
  const [updatedAt, setUpdatedAt] = React.useState(initialSettings.updatedAt);

  const [companyForm, setCompanyForm] = React.useState<CompanySettings>({
    name: initialSettings.name,
    ownerName: initialSettings.ownerName,
    phone: initialSettings.phone || "",
    address: initialSettings.address || "",
    timezone: initialSettings.timezone,
  });

  const [inventoryForm, setInventoryForm] = React.useState<InventorySettings>({
    defaultUnit: initialSettings.defaultUnit,
    defaultMinStock: initialSettings.defaultMinStock,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = React.useState<string | null>(null);

  const handleCompanyChange = React.useCallback((updated: Partial<CompanySettings>) => {
    setCompanyForm((prev) => ({ ...prev, ...updated }));
    setHasUnsavedChanges(true);
    setSaveMessage(null);
    setErrorMessage(null);
  }, []);

  const handleInventoryChange = React.useCallback((updated: Partial<InventorySettings>) => {
    setInventoryForm((prev) => ({ ...prev, ...updated }));
    setHasUnsavedChanges(true);
    setSaveMessage(null);
    setErrorMessage(null);
  }, []);

  const submitSettings = React.useCallback(
    async (
      fields: {
        name: string;
        ownerName: string;
        address: string | null;
        phone: string | null;
        timezone: "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";
        defaultUnit: string;
        defaultMinStock: number;
      },
      successNotice: string,
      onSuccess?: (updated: ShopSettingsDto) => void
    ) => {
      if (isSaving) return;
      setIsSaving(true);
      setErrorMessage(null);
      setConflictWarning(null);

      const requestId = crypto.randomUUID();
      try {
        const result = await updateShopSettingsAction({
          ...fields,
          requestId,
          expectedVersion: currentVersion,
        });

        if (result.ok) {
          const newSettings = result.data.settings;
          setCurrentVersion(newSettings.version);
          setUpdatedAt(newSettings.updatedAt);
          setHasUnsavedChanges(false);
          setSaveMessage(result.replayed ? "Permintaan telah diproses sebelumnya." : successNotice);
          setTimeout(() => setSaveMessage(null), 4000);
          onSuccess?.(newSettings);
        } else {
          if (result.code === "VERSION_CONFLICT") {
            setConflictWarning(
              "Konflik revisi: Pengaturan telah diperbarui di sesi lain. Draf Anda dipertahankan. Silakan periksa kembali sebelum menyimpan."
            );
          } else {
            setErrorMessage(result.message);
          }
        }
      } catch {
        setErrorMessage("Gagal menghubungkan ke server. Silakan coba lagi.");
      } finally {
        setIsSaving(false);
      }
    },
    [currentVersion, isSaving]
  );

  const handleSave = () => {
    submitSettings(
      {
        name: companyForm.name.trim(),
        ownerName: companyForm.ownerName.trim(),
        address: companyForm.address.trim() ? companyForm.address.trim() : null,
        phone: companyForm.phone.trim() ? companyForm.phone.trim() : null,
        timezone: companyForm.timezone,
        defaultUnit: inventoryForm.defaultUnit.trim(),
        defaultMinStock: inventoryForm.defaultMinStock,
      },
      t.settings.settingsSaved
    );
  };

  const handleConfirmReset = () => {
    submitSettings(
      {
        name: "Warung Berkah",
        ownerName: companyForm.ownerName.trim() || initialSettings.ownerName,
        address: null,
        phone: null,
        timezone: "Asia/Jakarta",
        defaultUnit: "Pcs",
        defaultMinStock: 15,
      },
      "Pengaturan dikembalikan ke standar awal warung.",
      (updated) => {
        setCompanyForm({
          name: updated.name,
          ownerName: updated.ownerName,
          address: "",
          phone: "",
          timezone: updated.timezone,
        });
        setInventoryForm({
          defaultUnit: updated.defaultUnit,
          defaultMinStock: updated.defaultMinStock,
        });
        setIsResetModalOpen(false);
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <SettingsHeader
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedMessage={saveMessage}
        updatedAt={updatedAt}
        version={currentVersion}
        isSaving={isSaving}
        onSave={handleSave}
        onResetModalOpen={() => setIsResetModalOpen(true)}
      />

      {/* Conflict or Error feedback */}
      {conflictWarning && (
        <div className="border-[3px] border-amber-600 bg-amber-50 p-4 text-amber-950 rounded-none shadow-hard-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Peringatan Konflik Versi</h4>
            <p className="text-xs leading-relaxed">{conflictWarning}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="border-[3px] border-red-600 bg-red-50 p-4 text-red-950 rounded-none shadow-hard-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Gagal Menyimpan</h4>
            <p className="text-xs leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <SettingsTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Tab Content */}
      <div className="pt-2">
        {activeTab === "company" && (
          <CompanySettingsForm
            key={`company-${currentVersion}`}
            initialValues={companyForm}
            ownerEmail={ownerEmail}
            onChange={handleCompanyChange}
          />
        )}

        {activeTab === "inventory" && (
          <InventorySettingsForm
            key={`inventory-${currentVersion}`}
            initialValues={inventoryForm}
            onChange={handleInventoryChange}
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
        isPending={isSaving}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
      />
    </div>
  );
}
