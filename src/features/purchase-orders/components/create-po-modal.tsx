"use client";

import * as React from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import {
  CreatePOFormSchema,
  type CreatePOFormData,
  type PurchaseOrder,
} from "../schemas/po.schema";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (po: PurchaseOrder) => void;
}

const DEFAULT_PO_FORM: CreatePOFormData = {
  supplierId: "sup-1",
  destinationWarehouseId: "wh-1",
  expectedDeliveryDate: "2026-08-25",
  notes: "",
  lineItems: [
    {
      id: "li-init-1",
      productId: "prod-1",
      productName: "NVIDIA RTX 4090 GPU",
      sku: "GPU-NV-4090",
      orderedQuantity: 5,
      unitCost: 1600,
    },
  ],
};

function createNewPOId(): string {
  return `po-${Date.now()}`;
}

function createPONumber(): string {
  return `PO-2026-0${Math.floor(Math.random() * 90) + 10}`;
}

function createLineItemId(seq: number): string {
  return `li-${Date.now()}-${seq}`;
}

export function CreatePOModal({ isOpen, onClose, onCreate }: CreatePOModalProps) {
  const { language, t } = useI18n();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePOFormData>({
    resolver: zodResolver(CreatePOFormSchema),
    defaultValues: DEFAULT_PO_FORM,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedLineItems = useWatch({ control, name: "lineItems" }) || [];
  const totalCost = watchedLineItems.reduce((sum, item) => {
    const qty = Number(item?.orderedQuantity) || 0;
    const cost = Number(item?.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  const handleAddItem = () => {
    append({
      id: createLineItemId(fields.length + 1),
      productId: "prod-2",
      productName: "Intel i9 14900K Processor",
      sku: "CPU-INT-14900K",
      orderedQuantity: 5,
      unitCost: 500,
    });
  };

  const onSubmit = (formData: CreatePOFormData) => {
    const suppliersMap: Record<string, { name: string; tier: string }> = {
      "sup-1": { name: "Nvidia Global Logistics", tier: "Tier 1 Preferred" },
      "sup-2": { name: "Logitech Official Direct", tier: "Tier 1 Preferred" },
      "sup-3": { name: "Samsung Semiconductor Asia", tier: "Tier 2 Standard" },
      "sup-4": { name: "ASUS Tek Procurement", tier: "Tier 2 Standard" },
    };

    const warehouseMap: Record<string, { id: string; en: string }> = {
      "wh-1": { id: "Gudang Utama Jakarta", en: "Main Warehouse Jakarta" },
      "wh-2": { id: "Hub Surabaya", en: "Surabaya Hub" },
      "wh-3": { id: "Depot Medan", en: "Medan Depot" },
    };

    const newPo: PurchaseOrder = {
      id: createNewPOId(),
      poNumber: createPONumber(),
      supplierId: formData.supplierId,
      supplierName: suppliersMap[formData.supplierId]?.name || "Vendor",
      supplierTier: suppliersMap[formData.supplierId]?.tier || "Tier 1",
      destinationWarehouseId: formData.destinationWarehouseId,
      destinationWarehouseName:
        language === "id"
          ? warehouseMap[formData.destinationWarehouseId]?.id || "Gudang Utama"
          : warehouseMap[formData.destinationWarehouseId]?.en || "Main Warehouse",
      status: "ISSUED",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: formData.expectedDeliveryDate,
      totalCost,
      lineItems: formData.lineItems.map((item, idx) => ({
        id: item.id || createLineItemId(idx),
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: 0,
        unitCost: item.unitCost,
      })),
      receipts: [],
      notes: formData.notes,
    };

    onCreate(newPo);
    reset(DEFAULT_PO_FORM);
    onClose();
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(openStatus: boolean) => !openStatus && onClose()}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="w-full max-w-2xl border-2 border-black bg-card p-6 shadow-neo">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
            <DialogTitle className="font-heading text-xl font-bold tracking-tight">
              {language === "id" ? "Buat Purchase Order" : "Create Purchase Order"}
            </DialogTitle>
            <DialogClose onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-sm">
                  {language === "id" ? "Vendor Pemasok" : "Supplier Vendor"}
                </Label>
                <select
                  {...register("supplierId")}
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm font-medium focus:border-black focus:ring-2 focus:ring-[#543afd]"
                >
                  <option value="sup-1">Nvidia Global Logistics</option>
                  <option value="sup-2">Logitech Official Direct</option>
                  <option value="sup-3">Samsung Semiconductor Asia</option>
                  <option value="sup-4">ASUS Tek Procurement</option>
                </select>
                {errors.supplierId && (
                  <p className="text-[11px] font-medium text-destructive mt-1">
                    {errors.supplierId.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="font-semibold text-sm">
                  {language === "id" ? "Gudang Tujuan" : "Destination Warehouse"}
                </Label>
                <select
                  {...register("destinationWarehouseId")}
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm font-medium focus:border-black focus:ring-2 focus:ring-[#543afd]"
                >
                  <option value="wh-1">
                    {language === "id" ? "Gudang Utama Jakarta" : "Main Warehouse Jakarta"}
                  </option>
                  <option value="wh-2">
                    {language === "id" ? "Hub Surabaya" : "Surabaya Hub"}
                  </option>
                  <option value="wh-3">
                    {language === "id" ? "Depot Medan" : "Medan Depot"}
                  </option>
                </select>
                {errors.destinationWarehouseId && (
                  <p className="text-[11px] font-medium text-destructive mt-1">
                    {errors.destinationWarehouseId.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="font-semibold text-sm">
                {language === "id" ? "Estimasi Tanggal Pengiriman" : "Expected Delivery Date"}
              </Label>
              <Input
                type="date"
                {...register("expectedDeliveryDate")}
                className="mt-1"
              />
              {errors.expectedDeliveryDate && (
                <p className="text-[11px] font-medium text-destructive mt-1">
                  {errors.expectedDeliveryDate.message}
                </p>
              )}
            </div>

            {/* Line Items Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm">
                  {language === "id" ? "Daftar Barang Pesanan" : "Order Items List"}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />{" "}
                  {language === "id" ? "Tambah Item" : "Add Item"}
                </Button>
              </div>

              {errors.lineItems?.message && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.lineItems.message}
                </p>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 rounded-md border border-border p-2 bg-slate-50"
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-xs text-foreground">
                        {field.productName}
                      </span>
                      <span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">
                        {field.sku}
                      </span>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min={1}
                        {...register(`lineItems.${index}.orderedQuantity` as const, {
                          valueAsNumber: true,
                        })}
                        className="h-8 text-xs text-center font-mono"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        {...register(`lineItems.${index}.unitCost` as const, {
                          valueAsNumber: true,
                        })}
                        className="h-8 text-xs text-right font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fields.length > 1 && remove(index)}
                      disabled={fields.length <= 1}
                      className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold text-sm text-muted-foreground">
                {language === "id" ? "Total Estimasi Biaya:" : "Total Estimated Cost:"}
              </span>
              <span className="font-mono text-xl font-bold text-foreground">
                ${totalCost.toLocaleString()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                className="border border-black bg-[#543afd] font-medium text-white shadow-neo hover:bg-[#462ee0]"
              >
                {language === "id" ? "Terbitkan Purchase Order" : "Issue Purchase Order"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
