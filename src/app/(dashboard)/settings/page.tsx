"use client";

import * as React from "react";
import {
  useSettings,
  SettingsHeader,
  SettingsTabNav,
  CompanySettingsForm,
  InventorySettingsForm,
  NotificationSettingsForm,
  TeamSettingsPanel,
  SystemResetModal,
  SettingsTab,
} from "@/features/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, ShieldCheck, Activity, Cpu, HardDrive } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("company");
  const [isResetModalOpen, setIsResetModalOpen] = React.useState(false);

  const {
    settings,
    hasUnsavedChanges,
    lastSavedMessage,
    updateCompany,
    updateInventory,
    updateNotifications,
    addTeamMember,
    removeTeamMember,
    updateMemberRole,
    saveAll,
    resetAll,
  } = useSettings();

  const activeAlertsCount = React.useMemo(() => {
    let count = 0;
    if (settings.notifications.emailLowStockAlert) count++;
    if (settings.notifications.dailyDigest) count++;
    if (settings.notifications.supplierReorderReminder) count++;
    if (settings.notifications.systemAuditLogs) count++;
    return count;
  }, [settings.notifications]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <SettingsHeader
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedMessage={lastSavedMessage}
        updatedAt={settings.updatedAt}
        onSave={saveAll}
        onResetModalOpen={() => setIsResetModalOpen(true)}
      />

      {/* Tab Navigation */}
      <SettingsTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        teamCount={settings.team.length}
        activeAlertsCount={activeAlertsCount}
      />

      {/* Main Form Content with Keyed Component Pattern to prevent React 19 render cascading */}
      <div className="pt-2">
        {activeTab === "company" && (
          <CompanySettingsForm
            key={`company-${settings.updatedAt}`}
            initialValues={settings.company}
            onChange={updateCompany}
          />
        )}

        {activeTab === "inventory" && (
          <InventorySettingsForm
            key={`inventory-${settings.updatedAt}`}
            initialValues={settings.inventory}
            onChange={updateInventory}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationSettingsForm
            key={`notifications-${settings.updatedAt}`}
            initialValues={settings.notifications}
            onChange={updateNotifications}
          />
        )}

        {activeTab === "team" && (
          <TeamSettingsPanel
            key={`team-${settings.team.length}-${settings.updatedAt}`}
            members={settings.team}
            onAddMember={addTeamMember}
            onRemoveMember={removeTeamMember}
            onUpdateRole={updateMemberRole}
          />
        )}

        {activeTab === "system" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border shadow-none">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Server className="h-5 w-5 text-[#543afd]" /> Status Lingkungan Operasional
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Informasi teknis runtime Next.js App Router dan mode penyimpanan lokal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Mode Aplikasi:</span>
                  <Badge className="border-black bg-emerald-100 text-emerald-900 font-bold uppercase tracking-wider">
                    Phase 0 — Frontend Foundation
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Penyimpanan Data:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5 text-[#543afd]" /> Browser LocalStorage
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Versi UI Engine:</span>
                  <span className="font-bold text-slate-800">StockOS Neo-SaaS v0.1.0</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Kepatuhan React 19:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Keyed Form Sub-Components
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Activity className="h-5 w-5 text-[#543afd]" /> Statistik Pemeliharaan Cache
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Kapasitas ruang data lokal dan kesehatan skema state persediaan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Metode Valuasi Aktif:</span>
                  <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-sm border border-purple-300">
                    {settings.inventory.valuationMethod}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Batas Stok Rendah Global:</span>
                  <span className="font-bold text-slate-900">{settings.inventory.defaultLowStockThreshold} {settings.inventory.defaultUnit}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Total Tim Terdaftar:</span>
                  <span className="font-bold text-slate-900">{settings.team.length} Pengguna</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status Saldo Negatif:</span>
                  <span className={settings.inventory.allowNegativeStock ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                    {settings.inventory.allowNegativeStock ? "Diizinkan (Risiko Mismatch)" : "Dilarang (Aman)"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* System Reset Modal */}
      <SystemResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={resetAll}
      />
    </div>
  );
}
