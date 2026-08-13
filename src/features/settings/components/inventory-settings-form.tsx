"use client";

import * as React from "react";
import { InventorySettings, ValuationMethod, DefaultUnit } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, Calculator, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InventorySettingsFormProps {
  initialValues: InventorySettings;
  onChange: (updated: Partial<InventorySettings>) => void;
}

export function InventorySettingsForm({ initialValues, onChange }: InventorySettingsFormProps) {
  const [formData, setFormData] = React.useState<InventorySettings>(initialValues);

  const handleChange = <K extends keyof InventorySettings>(field: K, value: InventorySettings[K]) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    onChange(next);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Thresholds & Default Units */}
      <Card className="border-border shadow-none">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Boxes className="h-5 w-5 text-[#543afd]" /> Ambang Batas & Satuan Default
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Standar kuantitas minimum peringatan stok dan unit barang bawaan saat pembuatan produk baru.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="defaultLowStockThreshold" className="text-xs font-semibold text-slate-700">
                Batas Minimum Stok Rendah (Default)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-help inline-flex items-center">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Jika stok fisik produk turun mencapai angka ini, produk akan ditandai berstatus &quot;LOW STOCK&quot;.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="defaultLowStockThreshold"
              type="number"
              min={1}
              value={formData.defaultLowStockThreshold}
              onChange={(e) => handleChange("defaultLowStockThreshold", parseInt(e.target.value) || 0)}
              className="h-9 font-mono text-xs focus-visible:ring-[#543afd]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defaultReorderQuantity" className="text-xs font-semibold text-slate-700">
              Kuantitas Pemesanan Ulang Default (Reorder Batch)
            </Label>
            <Input
              id="defaultReorderQuantity"
              type="number"
              min={1}
              value={formData.defaultReorderQuantity}
              onChange={(e) => handleChange("defaultReorderQuantity", parseInt(e.target.value) || 0)}
              className="h-9 font-mono text-xs focus-visible:ring-[#543afd]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Satuan Pengukuran Utama (Default Unit of Measure)
            </Label>
            <Select
              value={formData.defaultUnit}
              onValueChange={(v) => handleChange("defaultUnit", (v || "Pcs") as DefaultUnit)}
            >
              <SelectTrigger className="h-9 text-xs focus:ring-[#543afd]">
                <SelectValue placeholder="Pilih Satuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pcs">Pcs (Pieces)</SelectItem>
                <SelectItem value="Kg">Kg (Kilogram)</SelectItem>
                <SelectItem value="Box">Box (Karton / Dus)</SelectItem>
                <SelectItem value="Liter">Liter (Cairan)</SelectItem>
                <SelectItem value="Pack">Pack (Kemasan)</SelectItem>
                <SelectItem value="Roll">Roll (Gulungan)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounting & Stock Policies */}
      <Card className="border-border shadow-none">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Calculator className="h-5 w-5 text-[#543afd]" /> Metode Valuasi & Kebijakan Stok
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Kalkulasi nilai aset persediaan dan aturan toleransi saldo fisik di gudang.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Metode Valuasi Persediaan (Inventory Accounting)
            </Label>
            <Select
              value={formData.valuationMethod}
              onValueChange={(v) => handleChange("valuationMethod", (v || "FIFO") as ValuationMethod)}
            >
              <SelectTrigger className="h-9 text-xs focus:ring-[#543afd]">
                <SelectValue placeholder="Pilih Metode Valuasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIFO">FIFO (First-In, First-Out)</SelectItem>
                <SelectItem value="LIFO">LIFO (Last-In, First-Out)</SelectItem>
                <SelectItem value="WEIGHTED_AVERAGE">Weighted Average (Rata-rata Tertimbang)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500">
              Metode standar untuk menghitung total nilai aset laporan pada HPP dan laporan persediaan.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#543afd]" /> Perubahan Otomatis Status Stok Habis
                </Label>
                <p className="text-[11px] text-slate-500">
                  Otomatis ubah status produk jadi &quot;OUT OF STOCK&quot; saat saldo mencapai 0.
                </p>
              </div>
              <Switch
                checked={formData.autoOutofStock}
                onCheckedChange={(checked) => handleChange("autoOutofStock", checked)}
              />
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Izinkan Saldo Stok Negatif
                </Label>
                <p className="text-[11px] text-slate-500">
                  Mengizinkan pengeluaran stok meskipun saldo kurang dari nol (Bisa menyebabkan mismatch fisik).
                </p>
              </div>
              <Switch
                checked={formData.allowNegativeStock}
                onCheckedChange={(checked) => handleChange("allowNegativeStock", checked)}
              />
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-800">
                  Aktifkan Tracking Tanggal Kedaluwarsa (Batch Expiry)
                </Label>
                <p className="text-[11px] text-slate-500">
                  Pencatatan lot batch dan peringatan masa kedaluwarsa item produk.
                </p>
              </div>
              <Switch
                checked={formData.enableExpiryTracking}
                onCheckedChange={(checked) => handleChange("enableExpiryTracking", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
