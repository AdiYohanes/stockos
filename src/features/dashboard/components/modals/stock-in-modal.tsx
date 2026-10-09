"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  Plus,
  Sparkles,
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
import { useI18n } from "@/lib/i18n/context";

interface StockInModalProps {
  children: React.ReactNode;
}

interface StockInFormData {
  sku: string;
  qty: string;
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

const INITIAL_FORM_DATA: StockInFormData = {
  sku: "",
  qty: "",
  supplier: "",
  notes: "",
};

export function StockInModal({ children }: StockInModalProps) {
  const { t } = useI18n();
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
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-ink bg-emerald-100 shadow-hard-sm">
                    <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-ink uppercase tracking-wider font-sans">
                      Barang Masuk (Beli)
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-ink/60 font-mono uppercase tracking-widest mt-0.5">
                      Catat stok dari supplier / kulakan
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <DialogBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockin-product" className="text-[10px] font-bold uppercase tracking-widest text-ink">Produk</Label>
                      <div className="relative">
                        <select
                          id="stockin-product"
                          className="h-10 w-full rounded-none border-[3px] border-ink bg-white px-3 py-1.5 text-sm font-sans font-bold text-ink transition-shadow outline-none focus:shadow-hard-sm cursor-pointer"
                          required
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value)}
                        >
                          <option value="">Pilih produk...</option>
                          {MOCK_PRODUCTS.map((p) => (
                            <option key={p.sku} value={p.sku}>
                              [{p.sku}] {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="stockin-qty" className="text-[10px] font-bold uppercase tracking-widest text-ink">Jml Masuk (Pcs)</Label>
                      <Input
                        id="stockin-qty"
                        type="number"
                        min="1"
                        placeholder="0"
                        required
                        value={formData.qty}
                        onChange={(e) => handleInputChange("qty", e.target.value)}
                        className="font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockin-supplier" className="text-[10px] font-bold uppercase tracking-widest text-ink">Batch / No. Nota / Supplier</Label>
                      <Input
                        id="stockin-supplier"
                        placeholder="Contoh: Batch 1, Nota 1234, Budi"
                        value={formData.supplier}
                        onChange={(e) => handleInputChange("supplier", e.target.value)}
                        className="rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockin-notes" className="text-[10px] font-bold uppercase tracking-widest text-ink">Catatan</Label>
                      <textarea
                        id="stockin-notes"
                        rows={2}
                        placeholder="Opsional..."
                        className="w-full rounded-none border-[3px] border-ink bg-white px-3 py-2 text-sm font-sans text-ink transition-shadow outline-none focus:shadow-hard-sm resize-none placeholder:text-ink/50"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                      />
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" className="btn-neo border-[3px]" />}
                  >
                    "Batal"
                  </DialogClose>
                  <Button type="submit" size="sm" className="bg-emerald-400 hover:bg-emerald-500 text-ink border-[3px] border-ink shadow-hard-sm press">
                    "Simpan Stok Masuk"
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
                  <div className="absolute h-24 w-24 rounded-none bg-emerald-500/15 animate-ring-pulse pointer-events-none" />

                  <div className="absolute -top-1.5 -right-2 text-emerald-500 animate-in fade-in zoom-in duration-500 delay-300">
                    <Sparkles className="h-4 w-4 fill-emerald-500/30" />
                  </div>
                  <div className="absolute -bottom-1 -left-2 text-primary animate-in fade-in zoom-in duration-500 delay-500">
                    <Sparkles className="h-3 w-3 fill-primary/30" />
                  </div>

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-none border-[3px] border-ink bg-emerald-50 shadow-hard-sm animate-check-pop">
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
                <DialogTitle className="text-xl font-bold font-sans uppercase tracking-widest text-ink">
                  {t.modals.stockIn.successTitle}
                </DialogTitle>
                <DialogDescription className="mt-1 text-[10px] text-ink/60 max-w-xs font-mono uppercase tracking-widest">
                  {t.modals.stockIn.successSubtitle}
                </DialogDescription>

                {/* Summary Preview Card */}
                {submittedData && (
                  <div className="mt-5 w-full border-[3px] border-ink bg-paper p-4 text-left shadow-hard-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 space-y-2.5">
                    <div className="flex items-start justify-between gap-3 border-b-[2px] border-ink/20 pb-2.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center border-[3px] border-ink bg-emerald-400 px-2 py-0.5 font-mono text-[10px] font-bold text-ink tracking-wider uppercase">
                            {submittedData.sku || "N/A"}
                          </span>
                        </div>
                        <p className="font-sans font-bold text-ink text-sm truncate pt-0.5 uppercase">
                          {matchedProduct?.name || t.modals.stockIn.selectedProduct}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-widest text-ink/60 font-mono font-bold block">
                          {t.modals.stockIn.stockAdded}
                        </span>
                        <span className="font-mono text-base font-bold text-ink">
                          +{submittedData.qty}{" "}
                          <span className="text-xs font-normal text-ink/60">
                            {matchedProduct?.unit || "unit"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {submittedData.supplier && (
                      <div className="flex items-center gap-1.5 text-[10px] text-ink/60 font-mono uppercase tracking-widest">
                        <FileText className="h-3 w-3 text-ink/60" />
                        <span>{t.modals.stockIn.refSupplier}: <span className="font-bold text-ink">{submittedData.supplier}</span></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <DialogClose
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-neo flex-1 sm:flex-initial sm:px-6 border-[3px]"
                      />
                    }
                  >
                    {t.modals.finish}
                  </DialogClose>
                  <Button
                    type="button"
                    className="bg-emerald-400 hover:bg-emerald-500 text-ink border-[3px] border-ink shadow-hard-sm press flex-1 sm:flex-initial sm:px-6 gap-1.5"
                    onClick={handleRecordAnother}
                  >
                    <Plus className="h-4 w-4" />
                    {t.modals.stockIn.receiveAnother}
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
