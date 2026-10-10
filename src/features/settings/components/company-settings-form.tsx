"use client";

import * as React from "react";
import { CompanySettings, TimezoneCode } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Mail, Phone, MapPin, User, ShieldCheck, Coins } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface CompanySettingsFormProps {
  initialValues: CompanySettings;
  ownerEmail?: string;
  onChange: (updated: Partial<CompanySettings>) => void;
}

export function CompanySettingsForm({ initialValues, ownerEmail, onChange }: CompanySettingsFormProps) {
  const { t } = useI18n();
  const [formData, setFormData] = React.useState<CompanySettings>(initialValues);

  const handleChange = (field: keyof CompanySettings, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    onChange(next);
  };

  const handleTimezoneChange = (val: string | null) => {
    const nextTz = (val as TimezoneCode) || "Asia/Jakarta";
    const next = { ...formData, timezone: nextTz };
    setFormData(next);
    onChange(next);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Business Identity */}
      <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
        <CardHeader className="border-b-[3px] border-ink pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
            <Building2 className="h-5 w-5 text-ink" /> {t.settings.businessIdentity}
          </CardTitle>
          <CardDescription className="text-xs text-ink/60">
            {t.settings.businessIdentityDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-xs font-semibold text-ink">
              {t.settings.storeName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t.settings.companyNamePlaceholder}
              maxLength={120}
              className="h-9 text-xs input-focus border-[3px] border-ink rounded-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ownerName" className="flex items-center gap-1 text-xs font-semibold text-ink">
              <User className="h-3.5 w-3.5 text-ink/60" /> {t.settings.fullName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => handleChange("ownerName", e.target.value)}
              placeholder="Nama Lengkap Pemilik"
              maxLength={120}
              className="h-9 text-xs input-focus border-[3px] border-ink rounded-none"
            />
          </div>

          {ownerEmail && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ownerEmail" className="flex items-center gap-1 text-xs font-semibold text-ink">
                  <Mail className="h-3.5 w-3.5 text-ink/60" /> {t.settings.officialEmail}
                </Label>
                <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-mono font-semibold">
                  <ShieldCheck className="h-3 w-3 mr-1 text-emerald-700" /> Terverifikasi
                </Badge>
              </div>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                readOnly
                disabled
                className="h-9 text-xs font-mono bg-slate-100 text-slate-700 border-[3px] border-ink rounded-none cursor-not-allowed"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="flex items-center gap-1 text-xs font-semibold text-ink">
              <Phone className="h-3.5 w-3.5 text-ink/60" /> {t.settings.phoneNumber}
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+62 812 3456 7890"
              maxLength={40}
              className="h-9 font-mono text-xs input-focus border-[3px] border-ink rounded-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="flex items-center gap-1 text-xs font-semibold text-ink">
              <MapPin className="h-3.5 w-3.5 text-ink/60" /> {t.settings.operationalAddress}
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t.settings.addressPlaceholder}
              className="text-xs resize-none input-focus border-[3px] border-ink rounded-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional & Operational Standards */}
      <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
        <CardHeader className="border-b-[3px] border-ink pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
            <Globe className="h-5 w-5 text-ink" /> {t.settings.localizationFinancial}
          </CardTitle>
          <CardDescription className="text-xs text-ink/60">
            {t.settings.localizationDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink">
              {t.settings.timezone} <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="h-9 text-xs input-focus border-[3px] border-ink rounded-none">
                <SelectValue placeholder={t.settings.selectTimezonePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Jakarta">WIB — Asia/Jakarta (UTC+7)</SelectItem>
                <SelectItem value="Asia/Makassar">WITA — Asia/Makassar (UTC+8)</SelectItem>
                <SelectItem value="Asia/Jayapura">WIT — Asia/Jayapura (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-ink/60">
              Digunakan untuk batas pergantian hari kalender laporan dan bukti transaksi.
            </p>
          </div>

          <div className="rounded-none border-[3px] border-ink bg-slate-50 p-4 space-y-3.5">
            <div className="flex items-start gap-2.5">
              <Coins className="h-4 w-4 text-[#543afd] shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">Mata Uang Operasional</span>
                  <Badge className="bg-slate-200 text-ink border-black text-[10px] font-mono">
                    IDR (Rp)
                  </Badge>
                </div>
                <p className="text-[11px] text-ink/60 mt-0.5 leading-relaxed">
                  Standar invariant: seluruh nilai harga beli, harga jual, dan modal dicatat dalam Rupiah bulat tanpa desimal mata uang.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">Cakupan Warung Tunggal</span>
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-mono">
                    Single Owner
                  </Badge>
                </div>
                <p className="text-[11px] text-ink/60 mt-0.5 leading-relaxed">
                  Satu warung, satu pemilik terverifikasi. Tidak menggunakan multi-cabang atau hierarki staf perusahaan.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
