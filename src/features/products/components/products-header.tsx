"use client";

import * as React from "react";
import { Package, Plus, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
      {/* Title & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-black bg-primary text-white shadow-neo">
          <Package className="h-5.5 w-5.5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t.products.title}
            </h1>
            <span className="inline-flex items-center rounded-sm border border-black bg-muted px-2.5 py-0.5 font-mono text-[13px] font-bold text-foreground tracking-wider shadow-neo-sm">
              {totalCount} {t.common.items}
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
            {t.products.subtitle}
          </p>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {/* Export Button */}
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

        {/* Add Product Modal Trigger */}
        <ProductAddModal onProductAdded={onProductAdded}>
          <Button size="sm" className="btn-neo-primary gap-1.5 h-9 font-semibold">
            <Plus className="h-4 w-4" />
            <span>{t.products.addProduct}</span>
          </Button>
        </ProductAddModal>
      </div>
    </div>
  );
}
