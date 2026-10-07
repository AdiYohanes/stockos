"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  CreateProductInputSchema,
  type CreateProductInput,
  type Product,
} from "../schemas/product.schema";

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

const DEFAULT_FORM_VALUES: CreateProductInput = {
  name: "",
  sku: "",
  category: "Electronics",
  unit: "pcs",
  unitPrice: 0,
  initialStock: 0,
  minStock: 20,
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
  const [createdProduct, setCreatedProduct] = React.useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductInputSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled && setControlledOpen) {
      setControlledOpen(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      setTimeout(() => {
        setIsSuccess(false);
        reset(DEFAULT_FORM_VALUES);
        setCreatedProduct(null);
      }, 200);
    }
  };

  const onSubmit = (data: CreateProductInput) => {
    if (onProductAdded) {
      const added = onProductAdded({
        name: data.name,
        sku: data.sku,
        category: data.category,
        unit: data.unit,
        unitPrice: data.unitPrice,
        initialStock: data.initialStock,
        minStock: data.minStock,
        warehouse: data.warehouse,
        supplier: data.supplier,
        description: data.description,
      });
      setCreatedProduct(added);
    }
    setIsSuccess(true);
  };

  const handleAddAnother = () => {
    setIsSuccess(false);
    reset(DEFAULT_FORM_VALUES);
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-slate-100 dark:bg-slate-800 text-foreground">
                    <PackagePlus className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold text-foreground font-sans">
                      Add New Product
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Register a new inventory item with SKU & tracking parameters
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogBody className="max-h-[70vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="prod-name">Product Name *</Label>
                      <Input
                        id="prod-name"
                        placeholder="e.g. ESP32-WROOM-32D Microcontroller Module"
                        {...register("name")}
                        className="h-9 text-xs sm:text-sm"
                      />
                      {errors.name && (
                        <p className="text-[11px] font-medium text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-sku">SKU Code *</Label>
                      <div className="relative">
                        <Input
                          id="prod-sku"
                          placeholder="e.g. ELEC-ESP-32"
                          className="h-9 pr-8 font-mono tabular-nums uppercase text-xs sm:text-sm"
                          {...register("sku")}
                        />
                        <Barcode className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      {errors.sku && (
                        <p className="text-[11px] font-medium text-destructive">
                          {errors.sku.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-category">Category *</Label>
                      <select
                        id="prod-category"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        {...register("category")}
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-[11px] font-medium text-destructive">
                          {errors.category.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-unit">Unit of Measure *</Label>
                      <select
                        id="prod-unit"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer font-mono"
                        {...register("unit")}
                      >
                        {PRODUCT_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      {errors.unit && (
                        <p className="text-[11px] font-medium text-destructive">
                          {errors.unit.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-warehouse">Warehouse Location *</Label>
                      <select
                        id="prod-warehouse"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        {...register("warehouse")}
                      >
                        {WAREHOUSES.map((wh) => (
                          <option key={wh} value={wh}>
                            {wh}
                          </option>
                        ))}
                      </select>
                      {errors.warehouse && (
                        <p className="text-[11px] font-medium text-destructive">
                          {errors.warehouse.message}
                        </p>
                      )}
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
                          className="h-9 pl-7 font-mono tabular-nums text-xs sm:text-sm"
                          {...register("unitPrice", { valueAsNumber: true })}
                        />
                        <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      {errors.unitPrice && (
                        <p className="text-[11px] font-medium text-destructive">
                          {errors.unitPrice.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-initial-stock">Initial Stock</Label>
                      <Input
                        id="prod-initial-stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        className="h-9 font-mono tabular-nums text-xs sm:text-sm"
                        {...register("initialStock", { valueAsNumber: true })}
                      />
                      {errors.initialStock && (
                        <p className="text-[11px] font-medium text-destructive">
                          {errors.initialStock.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-min-stock">Min Stock Level *</Label>
                      <Input
                        id="prod-min-stock"
                        type="number"
                        min="0"
                        placeholder="20"
                        className="h-9 font-mono tabular-nums text-xs sm:text-sm"
                        {...register("minStock", { valueAsNumber: true })}
                      />
                      {errors.minStock && (
                        <p className="text-[11px] font-medium text-destructive">
                          {errors.minStock.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prod-supplier">Supplier</Label>
                      <Input
                        id="prod-supplier"
                        placeholder="e.g. Espressif Systems Ltd."
                        className="h-9 text-xs sm:text-sm"
                        {...register("supplier")}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="prod-desc">Description (Optional)</Label>
                      <Input
                        id="prod-desc"
                        placeholder="Short notes about specifications or application..."
                        className="h-9 text-xs sm:text-sm"
                        {...register("description")}
                      />
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter className="mt-4 pt-3 border-t border-border">
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" className="h-9 text-xs hover:border-slate-400" />}
                  >
                    Cancel
                  </DialogClose>
                  <Button type="submit" size="sm" className="h-9 text-xs font-medium gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                    <Plus className="h-3.5 w-3.5" />
                    Save Product
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            /* ================= SUCCESS VIEW ================= */
            <>
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold text-foreground font-sans">
                      Product Registered Successfully!
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      The product has been added to inventory with an initial status.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <DialogBody className="space-y-4 py-2">
                {createdProduct && (
                  <div className="rounded-md border border-border bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono tabular-nums text-xs font-semibold text-foreground">
                          {createdProduct.sku}
                        </span>
                        <h4 className="text-sm font-semibold text-foreground font-sans">
                          {createdProduct.name}
                        </h4>
                      </div>
                      <span className="inline-flex items-center rounded-sm border border-border px-2 py-0.5 text-xs font-medium bg-card text-foreground font-sans">
                        {createdProduct.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-sans">
                          Stock
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-foreground">
                          {createdProduct.currentStock} {createdProduct.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-sans">
                          Min Level
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-foreground">
                          {createdProduct.minStock} {createdProduct.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-sans">
                          Unit Price
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-foreground">
                          ${createdProduct.unitPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border/60 pt-2 font-sans">
                      <WarehouseIcon className="h-3.5 w-3.5" />
                      <span>{createdProduct.warehouse}</span>
                    </div>
                  </div>
                )}
              </DialogBody>

              <DialogFooter className="mt-2 pt-3 border-t border-border gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAnother}
                  className="h-9 text-xs gap-1.5 hover:border-slate-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Another
                </Button>
                <DialogClose
                  render={
                    <Button size="sm" className="h-9 text-xs font-medium gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                      <Layers className="h-3.5 w-3.5" />
                      Done
                    </Button>
                  }
                />
              </DialogFooter>
            </>
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
