"use client";

import * as React from "react";
import { Plus, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
import { useI18n } from "@/lib/i18n/context";
import { ProductAddModal } from "./product-add-modal";
import type { Product } from "../types";

interface ProductsHeaderProps {
  totalCount: number;
  onProductAdded: (productData: {
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

export function ProductsHeader({ totalCount, onProductAdded }: ProductsHeaderProps) {
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className="h-9 gap-1.5 px-3 text-xs font-medium text-foreground hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-800"
      >
        {showExportSuccess ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              {language === "id" ? "Katalog Diekspor" : "Catalog Exported"}
            </span>
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {isExporting
                ? language === "id"
                  ? "Mengekspor..."
                  : "Exporting..."
                : language === "id"
                ? "Ekspor CSV"
                : "Export CSV"}
            </span>
          </>
        )}
      </Button>

      <ProductAddModal onProductAdded={onProductAdded}>
        <Button size="sm" className="h-9 gap-1.5 px-3.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-none">
          <Plus className="h-3.5 w-3.5" />
          <span>{t.products.addProduct}</span>
        </Button>
      </ProductAddModal>
    </>
  );

  return (
    <PageHeader
      title={t.products.title}
      badgeText={`${totalCount} ${t.common.items}`}
      description={t.products.subtitle}
      actions={actionButtons}
    />
  );
}
