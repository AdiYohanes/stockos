"use client";

import * as React from "react";
import { NotificationSettings } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Mail, Send, Webhook, ShieldAlert, CheckCircle2 } from "lucide-react";

interface NotificationSettingsFormProps {
  initialValues: NotificationSettings;
  onChange: (updated: Partial<NotificationSettings>) => void;
}

export function NotificationSettingsForm({ initialValues, onChange }: NotificationSettingsFormProps) {
  const [formData, setFormData] = React.useState<NotificationSettings>(initialValues);
  const [testWebhookStatus, setTestWebhookStatus] = React.useState<string | null>(null);

  const handleChange = <K extends keyof NotificationSettings>(field: K, value: NotificationSettings[K]) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    onChange(next);
  };

  const handleTestWebhook = () => {
    setTestWebhookStatus("Mengirim tes payload event...");
    setTimeout(() => {
      setTestWebhookStatus("Berhasil! Status HTTP 200 OK (Simulasi payload terkirim)");
      setTimeout(() => setTestWebhookStatus(null), 4000);
    }, 1200);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Automated Email Alerts */}
      <Card className="border-border shadow-none">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Bell className="h-5 w-5 text-[#543afd]" /> Peringatan Email Otomatis
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Atur kondisi kejadian di mana sistem akan mengirimkan email notifikasi ke manajer operasional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-800">
                  Email Peringatan Stok Rendah (Low Stock Alerts)
                </Label>
                <p className="text-[11px] text-slate-500">
                  Kirim email saat ada barang mencapai atau di bawah batas stok minimum.
                </p>
              </div>
              <Switch
                checked={formData.emailLowStockAlert}
                onCheckedChange={(c) => handleChange("emailLowStockAlert", c)}
              />
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-800">
                  Ringkasan Gerakan Stok Harian (Daily Stock Digest)
                </Label>
                <p className="text-[11px] text-slate-500">
                  Kirim laporan rekapitulasi mutasi barang masuk & keluar setiap sore pukul 17:00 WIB.
                </p>
              </div>
              <Switch
                checked={formData.dailyDigest}
                onCheckedChange={(c) => handleChange("dailyDigest", c)}
              />
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-800">
                  Pengingat Pemesanan Pemasok (Supplier Reorder Alert)
                </Label>
                <p className="text-[11px] text-slate-500">
                  Pengingat pembelian ulang stok ke supplier utama saat mendekati safety stock.
                </p>
              </div>
              <Switch
                checked={formData.supplierReorderReminder}
                onCheckedChange={(c) => handleChange("supplierReorderReminder", c)}
              />
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-800">
                  Log Perubahan Sensitif (Audit Logs)
                </Label>
                <p className="text-[11px] text-slate-500">
                  Notifikasi audit saat ada penyesuaian stok manual atau penghapusan data.
                </p>
              </div>
              <Switch
                checked={formData.systemAuditLogs}
                onCheckedChange={(c) => handleChange("systemAuditLogs", c)}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="alertRecipients" className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> Daftar Email Penerima Peringatan
            </Label>
            <Input
              id="alertRecipients"
              value={formData.alertRecipients}
              onChange={(e) => handleChange("alertRecipients", e.target.value)}
              placeholder="pisahkan dengan tanda koma..."
              className="h-9 text-xs focus-visible:ring-[#543afd]"
            />
            <p className="text-[11px] text-slate-500">
              Gunakan tanda koma untuk mendaftarkan beberapa email sekaligus.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Integrations */}
      <Card className="border-border shadow-none">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Webhook className="h-5 w-5 text-[#543afd]" /> Integrasi Webhook Event
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Hubungkan StockOS ke aplikasi eksternal (Slack, Discord, ERP internal, WhatsApp Gateway).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="webhookUrl" className="text-xs font-semibold text-slate-700">
              URL Endpoint Webhook HTTP POST
            </Label>
            <Input
              id="webhookUrl"
              value={formData.webhookUrl}
              onChange={(e) => handleChange("webhookUrl", e.target.value)}
              placeholder="https://api.domain.com/webhooks/stockos"
              className="h-9 font-mono text-xs focus-visible:ring-[#543afd]"
            />
            <p className="text-[11px] text-slate-500">
              Sistem akan mengirimkan JSON payload peristiwa mutasi stok atau alarm stok kritis ke URL ini.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs text-emerald-400 overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>SIMULASI EVENT PAYLOAD:</span>
              <span className="text-[#543afd]">event: &quot;stock.low_alert&quot;</span>
            </div>
            <pre className="text-[11px] overflow-x-auto text-slate-200">
{`{
  "event": "stock.low_alert",
  "timestamp": "${new Date().toISOString()}",
  "sku": "SKU-KAP-002",
  "product": "Kertas HVS A4 80gr",
  "current_stock": 8,
  "threshold": 15
}`}
            </pre>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestWebhook}
              className="h-9 border-black font-mono text-xs font-semibold text-slate-800 hover:bg-slate-100 active:translate-y-px"
            >
              <Send className="mr-1.5 h-3.5 w-3.5 text-[#543afd]" /> Uji Kirim Webhook (Simulasi)
            </Button>

            {testWebhookStatus && (
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 p-2 text-xs font-semibold text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{testWebhookStatus}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
