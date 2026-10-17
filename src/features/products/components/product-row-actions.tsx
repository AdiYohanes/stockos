"use client";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const item = "min-h-11 rounded-none px-3 py-2 font-mono text-xs font-bold focus:bg-acid/15 data-highlighted:bg-acid/15";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t.common.actions}: ${product.name}`}
        className="input-focus press inline-flex size-11 items-center justify-center border-[3px] border-ink bg-paper shadow-neo-sm"
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)] rounded-none border-[3px] border-ink bg-paper text-ink shadow-neo ring-0">
        <DropdownMenuItem className={item} onClick={() => onViewDetails(product)}>{t.common.details}</DropdownMenuItem>
        <DropdownMenuItem className={item} disabled={Boolean(product.archivedAt)} onClick={() => onEdit(product)}>{t.common.edit}</DropdownMenuItem>
        {onQuickMovement && <>
          <DropdownMenuItem className={item} disabled={Boolean(product.archivedAt)} onClick={() => onQuickMovement(product, "in")}>{p.receipt}</DropdownMenuItem>
          <DropdownMenuItem className={item} disabled={Boolean(product.archivedAt) || product.currentStock === 0} onClick={() => onQuickMovement(product, "out")}>{p.sold}</DropdownMenuItem>
        </>}
        <DropdownMenuSeparator className="bg-ink" />
        <DropdownMenuItem className={item} onClick={() => onDelete(product)}>{product.archivedAt ? p.reactivate : p.archive}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
