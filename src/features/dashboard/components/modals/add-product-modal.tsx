"use client";

import * as React from "react";
import {
  PackagePlus,
  Barcode,
  Plus,
  Sparkles,
  Layers,
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

interface AddProductModalProps {
  children: React.ReactNode;
}

interface ProductFormData {
  supplier: string;
  name: string;
  cartons: string;
  totalPieces: string;
  totalPurchasePrice: string;
  unitPrice: string;
  barcode: string;
}

const INITIAL_FORM_DATA: ProductFormData = {
  supplier: "",
  name: "",
  cartons: "",
  totalPieces: "",
  totalPurchasePrice: "",
  unitPrice: "",
  barcode: "",
};

export function AddProductModal({ children }: AddProductModalProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState<ProductFormData>(INITIAL_FORM_DATA);
  const [submittedProduct, setSubmittedProduct] = React.useState<ProductFormData | null>(null);

  // Derived values
  const totalPurchasePriceNum = parseFloat(formData.totalPurchasePrice) || 0;
  const totalPiecesNum = parseInt(formData.totalPieces) || 0;
  const unitPurchasePrice = totalPiecesNum > 0 ? totalPurchasePriceNum / totalPiecesNum : 0;
  const unitPriceNum = parseFloat(formData.unitPrice) || 0;
  const profitPerUnit = unitPriceNum - unitPurchasePrice;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        setIsSuccess(false);
        setFormData(INITIAL_FORM_DATA);
        setSubmittedProduct(null);
      }, 200);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmittedProduct({ ...formData });
    setIsSuccess(true);
  };

  const handleAddAnother = () => {
    setIsSuccess(false);
    setFormData(INITIAL_FORM_DATA);
    setSubmittedProduct(null);
  };

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="overflow-hidden max-w-xl">
          {!isSuccess ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-ink bg-acid/10 shadow-hard-sm">
                    <PackagePlus className="h-5 w-5 text-acid" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-ink uppercase tracking-wider font-sans">
                      Tambah Produk (Toko)
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-ink/60 font-mono uppercase tracking-widest mt-0.5">
                      Input stok barang & hitung margin
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <DialogBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product-supplier" className="text-[10px] font-bold uppercase tracking-widest text-ink">1. Supplier</Label>
                      <Input
                        id="product-supplier"
                        placeholder="Nama Supplier"
                        value={formData.supplier}
                        onChange={(e) => handleInputChange("supplier", e.target.value)}
                        required
                        className="rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product-name" className="text-[10px] font-bold uppercase tracking-widest text-ink">2. Nama Product</Label>
                      <Input
                        id="product-name"
                        placeholder="Nama produk"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        className="rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-cartons" className="text-[10px] font-bold uppercase tracking-widest text-ink">3. Jml Karton/Dus</Label>
                      <Input
                        id="product-cartons"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.cartons}
                        onChange={(e) => handleInputChange("cartons", e.target.value)}
                        className="font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-pcs" className="text-[10px] font-bold uppercase tracking-widest text-ink">4. Jml Pcs (Total)</Label>
                      <Input
                        id="product-pcs"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.totalPieces}
                        onChange={(e) => handleInputChange("totalPieces", e.target.value)}
                        required
                        className="font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-purchase" className="text-[10px] font-bold uppercase tracking-widest text-ink">5. Harga Total (Beli)</Label>
                      <Input
                        id="product-purchase"
                        type="number"
                        min="0"
                        placeholder="Rp 0"
                        value={formData.totalPurchasePrice}
                        onChange={(e) => handleInputChange("totalPurchasePrice", e.target.value)}
                        required
                        className="font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-sell" className="text-[10px] font-bold uppercase tracking-widest text-ink">6. Harga Jual Satuan</Label>
                      <Input
                        id="product-sell"
                        type="number"
                        min="0"
                        placeholder="Rp 0"
                        value={formData.unitPrice}
                        onChange={(e) => handleInputChange("unitPrice", e.target.value)}
                        required
                        className="font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product-barcode" className="text-[10px] font-bold uppercase tracking-widest text-ink">7. Barcode</Label>
                      <div className="relative">
                        <Input
                          id="product-barcode"
                          placeholder="Scan Barcode / SKU"
                          className="pr-8 font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                          value={formData.barcode}
                          onChange={(e) => handleInputChange("barcode", e.target.value.toUpperCase())}
                        />
                        <Barcode className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
                      </div>
                    </div>
                  </div>

                  {/* Profit Calculation Summary */}
                  <div className="mt-4 border-[3px] border-ink bg-paper p-3 text-sm font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-ink/70">Modal Satuan:</span>
                      <span className="font-bold">Rp {unitPurchasePrice.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink/70">Harga Jual:</span>
                      <span className="font-bold">Rp {unitPriceNum.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between pt-1 mt-1 border-t-2 border-dashed border-ink/20">
                      <span className="text-ink/70">Profit per Pcs:</span>
                      <span className={`font-bold ${profitPerUnit > 0 ? 'text-emerald-600' : profitPerUnit < 0 ? 'text-red-600' : 'text-ink'}`}>
                        {profitPerUnit > 0 ? '+' : ''}Rp {profitPerUnit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" />}
                  >
                    Batal
                  </DialogClose>
                  <Button type="submit" size="sm">
                    Simpan Produk
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-5 flex items-center justify-center">
                  <div className="absolute h-24 w-24 rounded-none bg-emerald-500/15 animate-ring-pulse pointer-events-none" />
                  <div className="absolute -top-1.5 -right-2 text-emerald-500 animate-in fade-in zoom-in duration-500 delay-300">
                    <Sparkles className="h-4 w-4 fill-emerald-500/30" />
                  </div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-none border-[3px] border-ink bg-emerald-50 shadow-hard-sm animate-check-pop">
                    <svg
                      className="h-12 w-12 text-emerald-600"
                      viewBox="0 0 52 52"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="26" cy="26" r="23" strokeWidth="2.5" className="stroke-emerald-200/80" />
                      <circle cx="26" cy="26" r="23" strokeWidth="3" strokeLinecap="round" className="stroke-emerald-600 animate-check-circle" />
                      <path d="M15 26.5L22.5 34L37 18.5" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-emerald-600 animate-check-path" />
                    </svg>
                  </div>
                </div>

                <DialogTitle className="text-xl font-bold font-sans uppercase tracking-widest text-ink">
                  Produk Tersimpan
                </DialogTitle>

                {submittedProduct && (
                  <div className="mt-5 w-full border-[3px] border-ink bg-paper p-4 text-left shadow-hard-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center border-[3px] border-ink bg-acid/10 px-2 py-0.5 font-mono text-[10px] font-bold text-acid tracking-wider uppercase">
                            {submittedProduct.barcode || "NO-BARCODE"}
                          </span>
                        </div>
                        <p className="font-sans font-bold text-ink text-sm pt-1 uppercase">
                          {submittedProduct.name}
                        </p>
                        <p className="font-mono text-[10px] text-ink/60 uppercase">
                          Supplier: {submittedProduct.supplier}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-base font-bold text-ink">
                          {submittedProduct.totalPieces} Pcs
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <DialogClose
                    render={<Button type="button" variant="outline" className="btn-neo flex-1 sm:flex-initial sm:px-6" />}
                  >
                    Selesai
                  </DialogClose>
                  <Button
                    type="button"
                    className="btn-neo-primary flex-1 sm:flex-initial sm:px-6 gap-1.5"
                    onClick={handleAddAnother}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Lain
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
