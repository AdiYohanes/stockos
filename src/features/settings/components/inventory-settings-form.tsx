"use client";

import * as React from "react";
import { InventorySettings } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes, Calculator, ShieldCheck, AlertCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n/context";

interface InventorySettingsFormProps {
  initialValues: InventorySettings;
  onChange: (updated: Partial<InventorySettings>) => void;
}

export function InventorySettingsForm({ initialValues, onChange }: InventorySettingsFormProps) {
  const { t } = useI18n();
  const [formData, setFormData] = React.useState<InventorySettings>(initialValues);

  const handleChange = <K extends keyof InventorySettings>(field: K, value: InventorySettings[K]) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    onChange(next);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Defaults for New Products */}
      <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
        <CardHeader className="border-b-[3px] border-ink pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
            <Boxes className="h-5 w-5 text-ink" /> {t.settings.thresholdAndDefaultUnit}
          </CardTitle>
          <CardDescription className="text-xs text-ink/60">
            Nilai bawaan yang diterapkan pada pembuatan produk baru. Mengubah standar ini tidak akan mengubah produk yang sudah tersimpan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="defaultLowStockThreshold" className="text-xs font-semibold text-ink">
                {t.settings.defaultLowStock} <span className="text-red-500">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-help inline-flex items-center">
                    <HelpCircle className="h-3.5 w-3.5 text-ink/60" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t.settings.lowStockTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="defaultLowStockThreshold"
              type="number"
              min={0}
              max={1000000000}
              value={formData.defaultMinStock}
              onChange={(e) => handleChange("defaultMinStock", Math.max(0, parseInt(e.target.value) || 0))}
              className="h-9 font-mono text-xs input-focus border-[3px] border-ink rounded-none"
            />
            <p className="text-[11px] text-ink/60">
              Ambang batas bawaan saat mendaftarkan barang baru (misal: 15 {formData.defaultUnit}).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink">
              {t.settings.defaultUnitMeasure} <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select
                value={["Pcs", "Kg", "Box", "Liter", "Pack", "Roll", "Bungkus", "Botol"].includes(formData.defaultUnit) ? formData.defaultUnit : "custom"}
                onValueChange={(v) => {
                  if (v && v !== "custom") handleChange("defaultUnit", v);
                }}
              >
                <SelectTrigger className="h-9 text-xs input-focus border-[3px] border-ink rounded-none w-[160px] shrink-0">
                  <SelectValue placeholder={t.settings.selectUnit} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pcs">Pcs (Satuan)</SelectItem>
                  <SelectItem value="Kg">Kg (Kilogram)</SelectItem>
                  <SelectItem value="Box">Box (Karton)</SelectItem>
                  <SelectItem value="Bungkus">Bungkus</SelectItem>
                  <SelectItem value="Botol">Botol</SelectItem>
                  <SelectItem value="Liter">Liter</SelectItem>
                  <SelectItem value="Pack">Pack</SelectItem>
                  <SelectItem value="Roll">Roll</SelectItem>
                  <SelectItem value="custom">Lainnya...</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={formData.defaultUnit}
                onChange={(e) => handleChange("defaultUnit", e.target.value)}
                placeholder="Nama satuan (mis. Pcs)"
                maxLength={30}
                className="h-9 text-xs input-focus border-[3px] border-ink rounded-none font-mono"
              />
            </div>
            <p className="text-[11px] text-ink/60">
              Satuan dasar barang tidak dapat diubah setelah produk memiliki riwayat pergerakan stok.
            </p>
          </div>

          <div className="rounded-none border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Prinsip Integritas Data:</strong> Mengubah satuan atau ambang batas di sini tidak mengubah riwayat mutasi stok lama atau produk yang sudah ada di katalog.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Invariant Accounting & Operational Policies */}
      <Card className="border-[3px] border-ink bg-white shadow-hard-sm rounded-none">
        <CardHeader className="border-b-[3px] border-ink pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
            <Calculator className="h-5 w-5 text-ink" /> {t.settings.valMethodAndPolicies}
          </CardTitle>
          <CardDescription className="text-xs text-ink/60">
            Kebijakan operasional dan akuntansi persediaan yang berlaku secara invariant di seluruh modul StockOS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="rounded-none border-[3px] border-ink bg-slate-50 p-4 space-y-3.5">
            <div className="flex items-start gap-2.5">
              <Calculator className="h-4 w-4 text-[#543afd] shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">Metode Valuasi HPP</span>
                  <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px] font-mono">
                    Rata-Rata Tertimbang
                  </Badge>
                </div>
                <p className="text-[11px] text-ink/60 mt-0.5 leading-relaxed">
                  Modal dihitung secara presisi dari nota penerimaan riil. Stok keluar mengurangi modal secara proporsional tanpa asumsi FIFO/LIFO artifisial.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">Integritas Saldo Fisik</span>
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-mono">
                    Non-Negatif
                  </Badge>
                </div>
                <p className="text-[11px] text-ink/60 mt-0.5 leading-relaxed">
                  Sistem menolak pengeluaran stok yang melebihi saldo fisik tersedia. Tidak ada saldo negatif atau penjualan fiktif tanpa stok.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-start gap-2.5">
              <Boxes className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">Stok Opname & Koreksi</span>
                  <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-[10px] font-mono">
                    Audit Terikat
                  </Badge>
                </div>
                <p className="text-[11px] text-ink/60 mt-0.5 leading-relaxed">
                  Perbedaan stok fisik dicatat melalui Stok Opname. Jika ditemukan barang saat saldo nol, total modal beli wajib diisi agar nilai aset tetap dapat dipertanggungjawabkan.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
