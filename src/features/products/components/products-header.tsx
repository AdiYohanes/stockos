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
        className="btn-neo gap-1.5 h-9 font-medium"
      >
        {showExportSuccess ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">
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
        <Button size="sm" className="btn-neo-primary gap-1.5 h-9 font-semibold">
          <Plus className="h-4 w-4" />
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
