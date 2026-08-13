"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  Plus,
  Sparkles,
  Building2,
  FileText,
} from "lucide-react";
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockInModalProps {
  children: React.ReactNode;
}

interface StockInFormData {
  sku: string;
  qty: string;
  warehouse: string;
  supplier: string;
  notes: string;
}

const MOCK_PRODUCTS = [
  { sku: "ELEC-ESP-32", name: "ESP32-WROOM-32D Module", unit: "pcs" },
  { sku: "MECH-BRG-608", name: "Industrial Ball Bearing 608RS", unit: "pcs" },
  { sku: "CABL-USBC-2M", name: "Braided USB-C Cable 2m", unit: "pcs" },
  { sku: "FILA-PLA-BLK", name: "PLA+ Filament Black 1kg", unit: "spools" },
  { sku: "MOTR-STP-17", name: "NEMA 17 Stepper Motor", unit: "units" },
];

const WAREHOUSES = [
  "Main Hub (WH-1)",
  "East Annex (WH-2)",
  "South Depot (WH-3)",
];

const INITIAL_FORM_DATA: StockInFormData = {
  sku: "",
  qty: "",
  warehouse: "",
  supplier: "",
  notes: "",
};

export function StockInModal({ children }: StockInModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState<StockInFormData>(INITIAL_FORM_DATA);
  const [submittedData, setSubmittedData] = React.useState<StockInFormData | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        setIsSuccess(false);
        setFormData(INITIAL_FORM_DATA);
        setSubmittedData(null);
      }, 200);
    }
  };

  const handleInputChange = (field: keyof StockInFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmittedData({ ...formData });
    setIsSuccess(true);
  };

  const handleRecordAnother = () => {
    setIsSuccess(false);
    setFormData(INITIAL_FORM_DATA);
    setSubmittedData(null);
  };

  const matchedProduct = MOCK_PRODUCTS.find((p) => p.sku === (submittedData?.sku || formData.sku));

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="overflow-hidden">
          {!isSuccess ? (
            /* ================= FORM VIEW ================= */
            <>
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-emerald-500/10 shadow-neo-sm">
                    <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground font-heading">
                      Stok Masuk
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Terima pembelian atau pengiriman masuk
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <DialogBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockin-product">Produk</Label>
                      <div className="relative">
                        <select
                          id="stockin-product"
                          className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                          required
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value)}
                        >
                          <option value="">Pilih produk</option>
                          {MOCK_PRODUCTS.map((p) => (
                            <option key={p.sku} value={p.sku}>
                              [{p.sku}] {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="stockin-qty">Jumlah</Label>
                      <Input
                        id="stockin-qty"
                        type="number"
                        min="1"
                        placeholder="Masukkan jumlah"
                        required
                        value={formData.qty}
                        onChange={(e) => handleInputChange("qty", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="stockin-warehouse">Gudang</Label>
                      <select
                        id="stockin-warehouse"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                        required
                        value={formData.warehouse}
                        onChange={(e) => handleInputChange("warehouse", e.target.value)}
                      >
                        <option value="">Pilih gudang</option>
                        {WAREHOUSES.map((wh) => (
                          <option key={wh} value={wh}>{wh}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockin-supplier">Pemasok / Referensi PO</Label>
                      <Input
                        id="stockin-supplier"
                        placeholder="contoh: PO-2026-0847 atau Nama Pemasok"
                        value={formData.supplier}
                        onChange={(e) => handleInputChange("supplier", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockin-notes">Catatan</Label>
                      <textarea
                        id="stockin-notes"
                        rows={2}
                        placeholder="Catatan opsional..."
                        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] resize-none placeholder:text-muted-foreground"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                      />
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" />}
                  >
                    Batal
                  </DialogClose>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-black btn-neo">
                    Simpan Stok Masuk
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            /* ================= MODERN SUCCESS VIEW ================= */
            <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                {/* Modern Animated Checkmark */}
                <div className="relative mb-5 flex items-center justify-center">
                  <div className="absolute h-24 w-24 rounded-full bg-emerald-500/15 animate-ring-pulse pointer-events-none" />
                  
                  <div className="absolute -top-1.5 -right-2 text-emerald-500 animate-in fade-in zoom-in duration-500 delay-300">
                    <Sparkles className="h-4 w-4 fill-emerald-500/30" />
                  </div>
                  <div className="absolute -bottom-1 -left-2 text-primary animate-in fade-in zoom-in duration-500 delay-500">
                    <Sparkles className="h-3 w-3 fill-primary/30" />
                  </div>

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-emerald-50 shadow-neo animate-check-pop">
                    <svg
                      className="h-12 w-12 text-emerald-600"
                      viewBox="0 0 52 52"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="stroke-emerald-200/80"
                        cx="26"
                        cy="26"
                        r="23"
                        strokeWidth="2.5"
                      />
                      <circle
                        className="stroke-emerald-600 animate-check-circle"
                        cx="26"
                        cy="26"
                        r="23"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        className="stroke-emerald-600 animate-check-path"
                        d="M15 26.5L22.5 34L37 18.5"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Text Announcement */}
                <DialogTitle className="text-xl font-bold font-heading text-foreground">
                  Stok Masuk Berhasil Disimpan!
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground max-w-xs font-sans">
                  Pengiriman masuk telah dicatat dan ditambahkan ke jumlah stok gudang.
                </DialogDescription>

                {/* Summary Preview Card */}
                {submittedData && (
                  <div className="mt-5 w-full rounded-lg border border-border bg-muted/40 p-4 text-left shadow-neo-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 space-y-2.5">
                    <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-2.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-sm border border-black bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 tracking-wider uppercase shadow-neo-sm">
                            {submittedData.sku || "N/A"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono truncate">
                            <Building2 className="h-3 w-3" />
                            {submittedData.warehouse || "Gudang Utama"}
                          </span>
                        </div>
                        <p className="font-heading font-semibold text-foreground text-sm truncate pt-0.5">
                          {matchedProduct?.name || "Produk Dipilih"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-mono font-bold block">
                          Stok Ditambah
                        </span>
                        <span className="font-mono text-base font-bold text-emerald-700">
                          +{submittedData.qty}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {matchedProduct?.unit || "unit"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {submittedData.supplier && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                        <FileText className="h-3 w-3 text-foreground/60" />
                        <span>Ref / Pemasok: <span className="font-semibold text-foreground">{submittedData.supplier}</span></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-neo flex-1 sm:flex-initial sm:px-6"
                    onClick={() => handleOpenChange(false)}
                  >
                    Selesai
                  </Button>
                  <Button
                    type="button"
                    className="btn-neo-primary flex-1 sm:flex-initial sm:px-6 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleRecordAnother}
                  >
                    <Plus className="h-4 w-4" />
                    Terima Barang Lain
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
