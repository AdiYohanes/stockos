"use client";

import * as React from "react";
import { CompanySettings, CurrencyCode } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, CreditCard, Mail, Phone, MapPin, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface CompanySettingsFormProps {
  initialValues: CompanySettings;
  onChange: (updated: Partial<CompanySettings>) => void;
}

export function CompanySettingsForm({ initialValues, onChange }: CompanySettingsFormProps) {
  const { language, t } = useI18n();
  const [formData, setFormData] = React.useState<CompanySettings>(initialValues);

  const handleChange = (field: keyof CompanySettings, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    onChange(next);
  };

  const handleCurrencyChange = (val: string | null) => {
    const code = ((val as string) || "IDR") as CurrencyCode;
    const symbols: Record<CurrencyCode, string> = {
      IDR: "Rp",
      USD: "$",
      EUR: "€",
      SGD: "S$",
    };
    const next = { ...formData, currency: code, currencySymbol: symbols[code] || "Rp" };
    setFormData(next);
    onChange(next);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Company Info */}
      <Card className="border-border shadow-none">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-[#543afd]" /> {language === "id" ? "Identitas Usaha & Kontak" : "Business Identity & Contact"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            {language === "id" ? "Informasi umum nama usaha, nomor registrasi pajak, dan kontak operasional utama." : "General company info, tax registration number, and primary operational contact."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-xs font-semibold text-slate-700">
              {t.settings.storeName}
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder={language === "id" ? "Contoh: PT Logistik Nusantara" : "e.g. Acme Logistics Corp"}
              className="h-9 text-xs focus-visible:ring-[#543afd]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="taxId" className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <CreditCard className="h-3.5 w-3.5 text-slate-400" /> NPWP / Tax Registration ID
            </Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => handleChange("taxId", e.target.value)}
              placeholder="01.234.567.8-012.000"
              className="h-9 font-mono text-xs focus-visible:ring-[#543afd]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="officialEmail" className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {language === "id" ? "Email Resmi" : "Official Email"}
              </Label>
              <Input
                id="officialEmail"
                type="email"
                value={formData.officialEmail}
                onChange={(e) => handleChange("officialEmail", e.target.value)}
                placeholder="ops@company.com"
                className="h-9 text-xs focus-visible:ring-[#543afd]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {language === "id" ? "No. Telepon" : "Phone Number"}
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+62 21 5550 123"
                className="h-9 font-mono text-xs focus-visible:ring-[#543afd]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> {language === "id" ? "Alamat Lengkap Operasional" : "Full Operational Address"}
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              placeholder={language === "id" ? "Jl. Industri Utama No. 1..." : "123 Industrial Way..."}
              className="text-xs resize-none focus-visible:ring-[#543afd]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional & Financial Preferences */}
      <Card className="border-border shadow-none">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Globe className="h-5 w-5 text-[#543afd]" /> {language === "id" ? "Lokalisasi & Standar Keuangan" : "Localization & Financial Standards"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            {language === "id" ? "Mata uang default laporan, zona waktu gudang, dan format penanggalan transaksi." : "Report default currency, warehouse timezone, and date format preferences."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              {t.settings.currency}
            </Label>
            <Select value={formData.currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="h-9 text-xs focus:ring-[#543afd]">
                <SelectValue placeholder={language === "id" ? "Pilih Mata Uang" : "Select Currency"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDR">IDR - Rupiah Indonesia (Rp)</SelectItem>
                <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                <SelectItem value="SGD">SGD - Singapore Dollar (S$)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500">
              {language === "id" ? "Mata uang yang digunakan untuk laporan valuasi persediaan dan harga pokok." : "Primary currency used for inventory valuation and cost reporting."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              {t.settings.timezone}
            </Label>
            <Select value={formData.timezone} onValueChange={(v) => handleChange("timezone", (v as string) || "Asia/Jakarta (WIB)")}>
              <SelectTrigger className="h-9 text-xs focus:ring-[#543afd]">
                <SelectValue placeholder={language === "id" ? "Pilih Zona Waktu" : "Select Timezone"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Jakarta (WIB)">WIB - Asia/Jakarta (UTC+7)</SelectItem>
                <SelectItem value="Asia/Makassar (WITA)">WITA - Asia/Makassar (UTC+8)</SelectItem>
                <SelectItem value="Asia/Jayapura (WIT)">WIT - Asia/Jayapura (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              {language === "id" ? "Format Tanggal Laporan" : "Report Date Format"}
            </Label>
            <Select value={formData.dateFormat} onValueChange={(v) => handleChange("dateFormat", (v as string) || "DD/MM/YYYY")}>
              <SelectTrigger className="h-9 text-xs focus:ring-[#543afd]">
                <SelectValue placeholder={language === "id" ? "Pilih Format Tanggal" : "Select Date Format"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY ({language === "id" ? "Contoh" : "e.g. "}: 31/12/2026)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD ({language === "id" ? "Contoh" : "e.g. "}: 2026-12-31)</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY ({language === "id" ? "Contoh" : "e.g. "}: 12/31/2026)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="operatingHours" className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> {language === "id" ? "Jam Operasional Gudang" : "Warehouse Operating Hours"}
            </Label>
            <Input
              id="operatingHours"
              value={formData.operatingHours}
              onChange={(e) => handleChange("operatingHours", e.target.value)}
              placeholder="08:00 - 17:00 WIB"
              className="h-9 text-xs focus-visible:ring-[#543afd]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
