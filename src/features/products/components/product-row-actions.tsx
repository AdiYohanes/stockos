"use client";

import { useI18n } from "@/lib/i18n/context";
import type { ProductDto } from "../schemas/product-rpc.schema";

interface ProductRowActionsProps {
  product: ProductDto;
  onViewDetails: (product: ProductDto) => void;
  onEdit: (product: ProductDto) => void;
  onDelete: (product: ProductDto) => void;
  onQuickMovement?: (product: ProductDto, type: "in" | "out") => void;
}

export function ProductRowActions({ product, onViewDetails, onEdit, onDelete, onQuickMovement }: ProductRowActionsProps) {
  const { t } = useI18n();
  const p = t.products.persistent;
  const button = "input-focus border-2 border-ink px-2 py-1 text-[10px] font-bold uppercase bg-paper disabled:opacity-40";
  return <div className="flex flex-wrap justify-end gap-1">
    <button type="button" className={button} onClick={() => onViewDetails(product)}>{t.common.details}</button>
    <button type="button" className={button} disabled={Boolean(product.archivedAt)} onClick={() => onEdit(product)}>{t.common.edit}</button>
    {onQuickMovement && <>
      <button type="button" className={button} disabled={Boolean(product.archivedAt)} onClick={() => onQuickMovement(product, "in")}>{p.receipt}</button>
      <button type="button" className={button} disabled={Boolean(product.archivedAt) || product.currentStock === 0} onClick={() => onQuickMovement(product, "out")}>{p.sold}</button>
    </>}
    <button type="button" className={button} onClick={() => onDelete(product)}>{product.archivedAt ? p.reactivate : p.archive}</button>
  </div>;
}
