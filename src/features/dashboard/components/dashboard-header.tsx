"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  PackagePlus,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { ProductAddModal } from "@/features/products/components/product-add-modal";
import { StockMovementModal } from "@/features/inventory/components/stock-movement-modal";
import { mapProductToInventoryItem } from "@/features/inventory/adapters";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";

interface DashboardHeaderProps {
  userName?: string;
  rawProducts?: ProductDto[];
}

export function DashboardHeader({ userName, rawProducts = [] }: DashboardHeaderProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [movementOpen, setMovementOpen] = React.useState(false);
  const [movementType, setMovementType] = React.useState<"in" | "out">("in");
  const { t } = useI18n();

  const allItems = React.useMemo(() => rawProducts.map(mapProductToInventoryItem), [rawProducts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const welcomeText = userName
    ? `${t.dashboard.welcomeBack}, ${userName}. `
    : "";

  return (
    <header className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Title + Meta */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.nav.dashboard}
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-none border-[3px] border-black dark:border-white bg-[#dcfce7] dark:bg-[#052e16] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#15803d] dark:text-[#4ade80]">
            <span className="h-1.5 w-1.5 rounded-none bg-[#15803d] dark:bg-[#4ade80] animate-pulse" />
            {t.dashboard.badgeText}
          </span>
        </div>
        <span className="hidden lg:inline text-muted-foreground/30 text-base shrink-0">•</span>
        <p
          className="text-sm text-foreground mt-1 lg:mt-0 leading-relaxed max-w-2xl"
          title={`${welcomeText}${t.dashboard.subtitle}`}
        >
          {welcomeText}
          {t.dashboard.subtitle}
        </p>
      </div>

      {/* Quick Actions & Refresh */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-auto">
        <ProductAddModal onCommitted={async () => { router.refresh(); }}>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            title={t.dashboard.addProduct}
          >
            <PackagePlus className="text-primary group-hover/button:text-white transition-colors" />
            <span className="sr-only sm:not-sr-only">{t.dashboard.addProduct}</span>
          </Button>
        </ProductAddModal>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          title={t.dashboard.stockIn}
          onClick={() => {
            setMovementType("in");
            setMovementOpen(true);
          }}
        >
          <ArrowDownToLine className="text-emerald-600 dark:text-emerald-400 group-hover/button:text-white dark:group-hover/button:text-white transition-colors" />
          <span className="sr-only sm:not-sr-only">{t.dashboard.stockIn}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          title={t.dashboard.stockOut}
          onClick={() => {
            setMovementType("out");
            setMovementOpen(true);
          }}
        >
          <ArrowUpFromLine className="text-amber-600 dark:text-amber-400 group-hover/button:text-white dark:group-hover/button:text-white transition-colors" />
          <span className="sr-only sm:not-sr-only">{t.dashboard.stockOut}</span>
        </Button>

        <StockMovementModal
          open={movementOpen}
          onOpenChange={setMovementOpen}
          targetItem={null}
          defaultType={movementType}
          allItems={allItems}
          rawProducts={rawProducts}
          onCommitted={async () => {
            router.refresh();
          }}
        />

        <div className="h-5 w-[3px] bg-border mx-1 hidden sm:block" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5"
          aria-label="Refresh dashboard data"
          title={t.dashboard.refresh}
        >
          <RefreshCw
            className={cn(isRefreshing && "animate-spin")}
          />
          <span className="sr-only sm:not-sr-only">
            {t.dashboard.refresh}
          </span>
        </Button>
      </div>
    </header>
  );
}
