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
      <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
        <CardHeader className="border-b-[3px] border-ink pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-ink font-bold">
            <Building2 className="h-5 w-5 text-ink" /> {t.settings.businessIdentity}
          </CardTitle>
          <CardDescription className="text-xs text-ink/60">
            {t.settings.businessIdentityDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-xs font-semibold text-ink font-bold">
              {t.settings.storeName}
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder={t.settings.companyNamePlaceholder}
              className="h-9 text-xs input-focus border-[3px] border-ink rounded-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="taxId" className="flex items-center gap-1 text-xs font-semibold text-ink font-bold">
              <CreditCard className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none" /> NPWP / Tax Registration ID
            </Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => handleChange("taxId", e.target.value)}
              placeholder="01.234.567.8-012.000"
              className="h-9 font-mono text-xs input-focus border-[3px] border-ink rounded-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="officialEmail" className="flex items-center gap-1 text-xs font-semibold text-ink font-bold">
                <Mail className="h-3.5 w-3.5 text-ink/60" /> {t.settings.officialEmail}
              </Label>
              <Input
                id="officialEmail"
                type="email"
                value={formData.officialEmail}
                onChange={(e) => handleChange("officialEmail", e.target.value)}
                placeholder="ops@company.com"
                className="h-9 text-xs input-focus border-[3px] border-ink rounded-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1 text-xs font-semibold text-ink font-bold">
                <Phone className="h-3.5 w-3.5 text-ink/60" /> {t.settings.phoneNumber}
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+62 21 5550 123"
                className="h-9 font-mono text-xs input-focus border-[3px] border-ink rounded-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="flex items-center gap-1 text-xs font-semibold text-ink font-bold">
              <MapPin className="h-3.5 w-3.5 text-ink/60" /> {t.settings.operationalAddress}
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              placeholder={t.settings.addressPlaceholder}
              className="text-xs resize-none input-focus border-[3px] border-ink rounded-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional & Financial Preferences */}
      <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
        <CardHeader className="border-b-[3px] border-ink pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-ink font-bold">
            <Globe className="h-5 w-5 text-ink" /> {t.settings.localizationFinancial}
          </CardTitle>
          <CardDescription className="text-xs text-ink/60">
            {t.settings.localizationDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink font-bold">
              {t.settings.currency}
            </Label>
            <Select value={formData.currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="h-9 text-xs input-focus border-[3px] border-ink rounded-none">
                <SelectValue placeholder={t.settings.selectCurrencyPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDR">IDR - Rupiah Indonesia (Rp)</SelectItem>
                <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                <SelectItem value="SGD">SGD - Singapore Dollar (S$)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-ink/60">
              {t.settings.currencyDesc}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink font-bold">
              {t.settings.timezone}
            </Label>
            <Select value={formData.timezone} onValueChange={(v) => handleChange("timezone", (v as string) || "Asia/Jakarta (WIB)")}>
              <SelectTrigger className="h-9 text-xs input-focus border-[3px] border-ink rounded-none">
                <SelectValue placeholder={t.settings.selectTimezonePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Jakarta (WIB)">WIB - Asia/Jakarta (UTC+7)</SelectItem>
                <SelectItem value="Asia/Makassar (WITA)">WITA - Asia/Makassar (UTC+8)</SelectItem>
                <SelectItem value="Asia/Jayapura (WIT)">WIT - Asia/Jayapura (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink font-bold">
              {t.settings.reportDateFormat}
            </Label>
            <Select value={formData.dateFormat} onValueChange={(v) => handleChange("dateFormat", (v as string) || "DD/MM/YYYY")}>
              <SelectTrigger className="h-9 text-xs input-focus border-[3px] border-ink rounded-none">
                <SelectValue placeholder={t.settings.selectDateFormatPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY ({t.settings.exampleFormat}: 31/12/2026)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD ({t.settings.exampleFormat}: 2026-12-31)</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY ({t.settings.exampleFormat}: 12/31/2026)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="operatingHours" className="flex items-center gap-1 text-xs font-semibold text-ink font-bold">
              <Clock className="h-3.5 w-3.5 text-ink/60" /> {t.settings.shopOperatingHours}
            </Label>
            <Input
              id="operatingHours"
              value={formData.operatingHours}
              onChange={(e) => handleChange("operatingHours", e.target.value)}
              placeholder="08:00 - 17:00 WIB"
              className="h-9 text-xs input-focus border-[3px] border-ink rounded-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
