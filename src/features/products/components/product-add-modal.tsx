"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PackagePlus,
  Barcode,
  Plus,
  Sparkles,
  Search,
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
import {
  CreateProductInputSchema,
  type CreateProductInput,
  type Product,
} from "../schemas/product.schema";
import { useProducts } from "../hooks/use-products";

interface ProductAddModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProductAdded?: (productData: CreateProductInput) => Product;
}

const DEFAULT_FORM_VALUES: Partial<CreateProductInput> = {
  supplier: "",
  name: "",
  barcode: "",
  cartons: 0,
  initialStock: 0,
  totalPurchasePrice: 0,
  unitPrice: 0,
  sku: "",
  category: "Consumables",
  unit: "pcs",
  minStock: 10,
};

export function ProductAddModal({
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onProductAdded,
}: ProductAddModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = React.useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductInputSchema),
    defaultValues: DEFAULT_FORM_VALUES as CreateProductInput,
  });

  const { products, recordMovement, updateProduct } = useProducts();
  const currentName = watch("name");
  const existingProduct = React.useMemo(() => {
    if (!currentName) return null;
    return products.find((p) => p.name.toLowerCase() === currentName.toLowerCase()) || null;
  }, [currentName, products]);

  React.useEffect(() => {
    if (existingProduct) {
      setValue("supplier", existingProduct.supplier);
      setValue("sku", existingProduct.sku);
      setValue("barcode", existingProduct.barcode || "");
      setValue("unitPrice", existingProduct.unitPrice);
      setValue("category", existingProduct.category);
      setValue("unit", existingProduct.unit);
      setValue("minStock", existingProduct.minStock);
    }
  }, [existingProduct, setValue]);

  const totalPurchasePriceNum = watch("totalPurchasePrice") || 0;
  const totalPiecesNum = watch("initialStock") || 0;
  const unitPurchasePrice = totalPiecesNum > 0 ? totalPurchasePriceNum / totalPiecesNum : 0;
  const unitPriceNum = watch("unitPrice") || 0;
  const profitPerUnit = unitPriceNum - unitPurchasePrice;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled && setControlledOpen) {
      setControlledOpen(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      setError(null);
      setTimeout(() => {
        setIsSuccess(false);
        reset(DEFAULT_FORM_VALUES as CreateProductInput);
        setCreatedProduct(null);
      }, 200);
    }
  };

  const onSubmit = (data: CreateProductInput) => {
    setError(null);
    try {
      if (existingProduct) {
        if (data.initialStock > 0) {
          recordMovement(existingProduct.id, "in", data.initialStock, "RESTOCK", "Restock via tambah produk");
        }
        updateProduct(existingProduct.id, {
          unitPrice: data.unitPrice,
          supplier: data.supplier,
          barcode: data.barcode,
        });
        setCreatedProduct({
          ...existingProduct,
          currentStock: existingProduct.currentStock + data.initialStock,
          unitPrice: data.unitPrice,
          supplier: data.supplier,
          barcode: data.barcode,
        });
        setIsSuccess(true);
      } else {
        if (!onProductAdded) throw new Error("Fitur tambah produk belum tersedia.");

        if (!data.sku || data.sku.trim() === "") {
          data.sku = data.barcode ? data.barcode.substring(0, 8).toUpperCase() : `PRD-${Math.floor(Math.random() * 10000)}`;
        }

        setCreatedProduct(onProductAdded(data));
        setIsSuccess(true);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal membuat produk.");
    }
  };

  const handleAddAnother = () => {
    setIsSuccess(false);
    reset(DEFAULT_FORM_VALUES as CreateProductInput);
    setCreatedProduct(null);
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger render={children as React.ReactElement} />}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="overflow-hidden max-w-xl rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
          {!isSuccess ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-ink bg-acid/10 shadow-hard-sm">
                    <PackagePlus className="h-5 w-5 text-acid" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-ink uppercase tracking-wider font-sans">
                      Tambah / Update Produk
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-ink/60 font-mono uppercase tracking-widest mt-0.5">
                      Input stok barang baru atau update stok lama
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogBody className="max-h-[70vh] overflow-y-auto pr-2">
                  {error && <p role="alert" className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2">{error}</p>}

                  <input type="hidden" {...register("category")} />
                  <input type="hidden" {...register("unit")} />
                  <input type="hidden" {...register("minStock", { valueAsNumber: true })} />
                  <input type="hidden" {...register("sku")} />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product-supplier" className="text-[10px] font-bold uppercase tracking-widest text-ink">1. Supplier</Label>
                      <Input
                        id="product-supplier"
                        placeholder="Nama Supplier"
                        {...register("supplier")}
                        className="rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                      {errors.supplier && (
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.supplier.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product-name" className="text-[10px] font-bold uppercase tracking-widest text-ink">
                        2. Nama Product {existingProduct && <span className="text-emerald-600">(Produk Ditemukan - Akan Update Stok)</span>}
                      </Label>
                      <Input
                        id="product-name"
                        placeholder="Nama produk"
                        list="existing-products"
                        {...register("name")}
                        className="rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                      <datalist id="existing-products">
                        {products.map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                      {errors.name && (
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-cartons" className="text-[10px] font-bold uppercase tracking-widest text-ink">3. Jml Karton/Dus</Label>
                      <Input
                        id="product-cartons"
                        type="number"
                        min="0"
                        placeholder="0"
                        {...register("cartons", { valueAsNumber: true })}
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
                        {...register("initialStock", { valueAsNumber: true })}
                        className="font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                      {errors.initialStock && (
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.initialStock.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-purchase" className="text-[10px] font-bold uppercase tracking-widest text-ink">5. Harga Total (Beli)</Label>
                      <Input
                        id="product-purchase"
                        type="number"
                        min="0"
                        placeholder="Rp 0"
                        {...register("totalPurchasePrice", { valueAsNumber: true })}
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
                        {...register("unitPrice", { valueAsNumber: true })}
                        className="font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                      {errors.unitPrice && (
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.unitPrice.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product-barcode" className="text-[10px] font-bold uppercase tracking-widest text-ink">7. Barcode</Label>
                      <div className="relative">
                        <Input
                          id="product-barcode"
                          placeholder="Scan Barcode / SKU"
                          className="pr-8 font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                          {...register("barcode", {
                            onChange: (e) => {
                              setValue("barcode", e.target.value.toUpperCase());
                              setValue("sku", e.target.value.toUpperCase());
                            }
                          })}
                        />
                        <Barcode className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-[3px] border-ink bg-paper p-3 text-sm font-mono space-y-1 shadow-hard-sm">
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

                <DialogFooter className="mt-4 pt-3 border-t-[3px] border-ink">
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-ink rounded-none border-[3px] border-ink shadow-hard-sm press" />}
                  >
                    Batal
                  </DialogClose>
                  <Button type="submit" size="sm" className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-ink bg-acid/80 hover:bg-acid border-[3px] border-ink shadow-hard-sm press gap-1.5">
                    <Plus className="h-4 w-4" />
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

                {createdProduct && (
                  <div className="mt-5 w-full border-[3px] border-ink bg-paper p-4 text-left shadow-hard-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center border-[3px] border-ink bg-acid/10 px-2 py-0.5 font-mono text-[10px] font-bold text-acid tracking-wider uppercase">
                            {createdProduct.barcode || createdProduct.sku || "NO-BARCODE"}
                          </span>
                        </div>
                        <p className="font-sans font-bold text-ink text-sm pt-1 uppercase">
                          {createdProduct.name}
                        </p>
                        <p className="font-mono text-[10px] text-ink/60 uppercase">
                          Supplier: {createdProduct.supplier}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <DialogClose
                    render={<Button type="button" variant="outline" className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest text-ink bg-white rounded-none border-[3px] border-ink shadow-hard-sm press flex-1 sm:flex-initial" />}
                  >
                    Selesai
                  </DialogClose>
                  <Button
                    type="button"
                    className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest text-ink bg-acid/80 hover:bg-acid rounded-none border-[3px] border-ink shadow-hard-sm press flex-1 sm:flex-initial gap-1.5"
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
