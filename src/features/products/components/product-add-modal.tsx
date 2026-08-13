"use client";

import * as React from "react";
import {
  PackagePlus,
  Barcode,
  Plus,
  Sparkles,
  Layers,
  DollarSign,
  Warehouse as WarehouseIcon,
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
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, WAREHOUSES } from "../mock-data";
import type { Product } from "../types";

interface ProductAddModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProductAdded?: (productData: {
    name: string;
    sku: string;
    category: string;
    unit: string;
    unitPrice?: number;
    initialStock?: number;
    minStock: number;
    warehouse?: string;
    description?: string;
    supplier?: string;
  }) => Product;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unit: string;
  unitPrice: string;
  initialStock: string;
  minStock: string;
  warehouse: string;
  supplier: string;
  description: string;
}

const INITIAL_FORM_DATA: ProductFormData = {
  name: "",
  sku: "",
  category: "Electronics",
  unit: "pcs",
  unitPrice: "",
  initialStock: "",
  minStock: "20",
  warehouse: "Main Hub (WH-1)",
  supplier: "",
  description: "",
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
  const [formData, setFormData] = React.useState<ProductFormData>(INITIAL_FORM_DATA);
  const [createdProduct, setCreatedProduct] = React.useState<Product | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled && setControlledOpen) {
      setControlledOpen(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      setTimeout(() => {
        setIsSuccess(false);
        setFormData(INITIAL_FORM_DATA);
        setCreatedProduct(null);
      }, 200);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (onProductAdded) {
      const added = onProductAdded({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        unit: formData.unit,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
        initialStock: formData.initialStock ? parseInt(formData.initialStock, 10) : 0,
        minStock: formData.minStock ? parseInt(formData.minStock, 10) : 0,
        warehouse: formData.warehouse,
        supplier: formData.supplier,
        description: formData.description,
      });
      setCreatedProduct(added);
    }
    setIsSuccess(true);
  };

  const handleAddAnother = () => {
    setIsSuccess(false);
    setFormData(INITIAL_FORM_DATA);
    setCreatedProduct(null);
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger render={children as React.ReactElement} />}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-lg overflow-hidden">
          {!isSuccess ? (
            /* ================= FORM VIEW ================= */
            <>
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-primary/10 shadow-neo-sm">
                    <PackagePlus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground font-heading">
                      Add New Product
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Register a new inventory item with SKU & tracking parameters
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <DialogBody className="max-h-[70vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="prod-name">Product Name *</Label>
                      <Input
                        id="prod-name"
                        placeholder="e.g. ESP32-WROOM-32D Microcontroller Module"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        className="input-neo"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-sku">SKU Code *</Label>
                      <div className="relative">
                        <Input
                          id="prod-sku"
                          placeholder="e.g. ELEC-ESP-32"
                          className="input-neo pr-8 font-mono uppercase"
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value.toUpperCase())}
                          required
                        />
                        <Barcode className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-category">Category *</Label>
                      <select
                        id="prod-category"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        required
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-unit">Unit of Measure *</Label>
                      <select
                        id="prod-unit"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer font-mono"
                        value={formData.unit}
                        onChange={(e) => handleInputChange("unit", e.target.value)}
                        required
                      >
                        {PRODUCT_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-warehouse">Warehouse Location *</Label>
                      <select
                        id="prod-warehouse"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                        value={formData.warehouse}
                        onChange={(e) => handleInputChange("warehouse", e.target.value)}
                        required
                      >
                        {WAREHOUSES.map((wh) => (
                          <option key={wh} value={wh}>
                            {wh}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-unit-price">Unit Price ($)</Label>
                      <div className="relative">
                        <Input
                          id="prod-unit-price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="input-neo pl-7 font-mono"
                          value={formData.unitPrice}
                          onChange={(e) => handleInputChange("unitPrice", e.target.value)}
                        />
                        <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-initial-stock">Initial Stock</Label>
                      <Input
                        id="prod-initial-stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        className="input-neo font-mono"
                        value={formData.initialStock}
                        onChange={(e) => handleInputChange("initialStock", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-min-stock">Min Stock Level *</Label>
                      <Input
                        id="prod-min-stock"
                        type="number"
                        min="0"
                        placeholder="20"
                        className="input-neo font-mono"
                        value={formData.minStock}
                        onChange={(e) => handleInputChange("minStock", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-supplier">Supplier</Label>
                      <Input
                        id="prod-supplier"
                        placeholder="e.g. Espressif Systems Ltd."
                        className="input-neo"
                        value={formData.supplier}
                        onChange={(e) => handleInputChange("supplier", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="prod-desc">Description (Optional)</Label>
                      <Input
                        id="prod-desc"
                        placeholder="Short notes about specifications or application..."
                        className="input-neo"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                      />
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter className="mt-4 pt-3 border-t border-border">
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" className="btn-neo" />}
                  >
                    Cancel
                  </DialogClose>
                  <Button type="submit" size="sm" className="btn-neo-primary gap-1.5">
                    <Plus className="h-4 w-4" />
                    Save Product
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            /* ================= SUCCESS VIEW ================= */
            <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                {/* Checkmark Animation */}
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

                <DialogTitle className="text-xl font-bold font-heading text-foreground">
                  Product Successfully Created!
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground max-w-xs font-sans">
                  The product is registered and immediately available in your inventory catalog.
                </DialogDescription>

                {/* Summary Card */}
                {createdProduct && (
                  <div className="mt-5 w-full rounded-lg border border-border bg-muted/40 p-4 text-left shadow-neo-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center rounded-sm border border-black bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary tracking-wider uppercase shadow-neo-sm">
                            {createdProduct.sku}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <Layers className="h-3 w-3" />
                            {createdProduct.category}
                          </span>
                        </div>
                        <p className="font-heading font-semibold text-foreground text-sm truncate pt-1">
                          {createdProduct.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <WarehouseIcon className="h-3 w-3" />
                          {createdProduct.warehouse}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block">
                          Stock Level
                        </span>
                        <span className="font-mono text-base font-bold text-foreground">
                          {createdProduct.currentStock}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {createdProduct.unit}
                          </span>
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          ${createdProduct.unitPrice.toFixed(2)}/ea
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-neo flex-1 sm:flex-initial sm:px-6"
                    onClick={() => handleOpenChange(false)}
                  >
                    Done
                  </Button>
                  <Button
                    type="button"
                    className="btn-neo-primary flex-1 sm:flex-initial sm:px-6 gap-1.5"
                    onClick={handleAddAnother}
                  >
                    <Plus className="h-4 w-4" />
                    Add Another
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
