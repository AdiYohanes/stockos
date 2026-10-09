"use client";

import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  DialogRoot,
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
import { SkuBadge } from "@/components/shared/sku-badge";
import { useI18n } from "@/lib/i18n/context";
import type { Product } from "../types";

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: (id: string) => void;
}

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  onConfirmDelete,
}: DeleteProductDialogProps) {
  const { t } = useI18n();
  const [error, setError] = React.useState<string | null>(null);

  if (!product) return null;

  const handleDelete = () => {
    setError(null);
    try {
      onConfirmDelete(product.id);
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.common.error);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md overflow-hidden rounded-none border-[3px] border-ink bg-white shadow-hard-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-[3px] border-ink bg-rose-100 text-rose-600 shrink-0 shadow-hard-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold uppercase tracking-wider text-ink font-sans">
                  {t.products.deleteDialog.title}
                </DialogTitle>
                <DialogDescription className="text-[10px] text-ink/60 font-mono uppercase tracking-widest mt-0.5">
                  {t.products.deleteDialog.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            {error && <p role="alert" className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2">{error}</p>}
            <div className="border-[3px] border-ink bg-paper p-4 space-y-2 shadow-hard-sm">
              <div className="flex items-center gap-2">
                <SkuBadge code={product.sku} />
                <span className="font-sans font-bold text-ink uppercase truncate">
                  {product.name}
                </span>
              </div>
              <p className="text-[10px] text-ink/60 font-mono uppercase tracking-widest">
                {t.products.deleteDialog.currentStock}: <strong className="text-ink">{product.currentStock} {product.unit}</strong>              </p>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-rose-600 leading-relaxed bg-rose-50 border-[3px] border-rose-200 p-2">
              {t.products.deleteDialog.warningText}
            </p>
          </DialogBody>

          <DialogFooter className="mt-4 pt-3 border-t-[3px] border-ink">
            <DialogClose
              render={<Button variant="outline" size="sm" type="button" className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-ink rounded-none border-[3px] border-ink shadow-hard-sm press" />}
            >
              {t.common.cancel}
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={handleDelete}
              className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest bg-rose-500 text-ink rounded-none border-[3px] border-ink hover:bg-rose-600 shadow-hard-sm press gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {t.products.deleteDialog.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
