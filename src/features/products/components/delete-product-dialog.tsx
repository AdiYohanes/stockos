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
      setError(error instanceof Error ? error.message : "Unable to delete product.");
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground font-sans">
                  {t.products.deleteDialog.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {t.products.deleteDialog.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
            <div className="rounded-md border border-border bg-slate-50/60 dark:bg-slate-900/40 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <SkuBadge code={product.sku} />
                <span className="font-sans font-medium text-sm text-foreground truncate">
                  {product.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono tabular-nums">
                {t.products.deleteDialog.currentStock}: <strong>{product.currentStock} {product.unit}</strong> • {t.products.deleteDialog.location}: <strong>{product.warehouse}</strong>
              </p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {t.products.deleteDialog.warningText}
            </p>
          </DialogBody>

          <DialogFooter className="mt-4 pt-3 border-t border-border">
            <DialogClose
              render={<Button variant="outline" size="sm" type="button" className="h-9 text-xs hover:border-slate-400" />}
            >
              {t.common.cancel}
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={handleDelete}
              className="h-9 text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.products.deleteDialog.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
