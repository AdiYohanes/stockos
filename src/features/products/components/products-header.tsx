"use client";

import * as React from "react";
import { Plus, Download, Check } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { useI18n } from "@/lib/i18n/context";
import { ProductAddModal } from "./product-add-modal";
import type { Product } from "../types";
import type { CreateProductInput } from "../schemas/product.schema";

interface ProductsHeaderProps {
  onProductAdded: (productData: CreateProductInput) => Product;
}

export function ProductsHeader({ onProductAdded }: ProductsHeaderProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [showExportSuccess, setShowExportSuccess] = React.useState(false);
  const { language, t } = useI18n();

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    }, 600);
  };

  const actionButtons = (
    <>
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="btn-neo h-10 gap-2 px-4 text-xs font-bold uppercase text-ink flex items-center justify-center disabled:opacity-50"
      >
        {showExportSuccess ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-700 font-bold">
              {t.common.success}
            </span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 text-ink" />
            <span>
              {isExporting ? t.common.loading : t.common.export}
            </span>
          </>
        )}
      </button>

      <ProductAddModal onProductAdded={onProductAdded}>
        <button type="button" className="btn-neo-primary h-10 gap-2 px-5 text-xs flex items-center justify-center">
          <Plus className="h-4 w-4" />
          <span>{t.products.addProduct}</span>
        </button>
      </ProductAddModal>
    </>
  );

  return (
    <PageHeader
      title={t.products.title}
      description={t.products.subtitle}
      actions={actionButtons}
    />
  );
}
