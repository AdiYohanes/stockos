"use client";

import * as React from "react";
import {
  RefreshCw,
  PackagePlus,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddProductModal } from "./modals/add-product-modal";
import { StockInModal } from "./modals/stock-in-modal";
import { StockOutModal } from "./modals/stock-out-modal";
import { TransferModal } from "./modals/transfer-modal";

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Title + Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-black bg-[#dcfce7] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#15803d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#15803d] animate-pulse" />
            Live
          </span>
        </div>
        <span className="hidden sm:inline text-muted-foreground/30 text-base">•</span>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {userName ? `Welcome back, ${userName}. ` : ""}Overview of stock activity and inventory health.
        </p>
      </div>

      {/* Quick Actions & Refresh */}
      <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto max-w-full pb-0.5 sm:pb-0">
        <AddProductModal>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold whitespace-nowrap hover:border-black"
          >
            <PackagePlus className="h-3.5 w-3.5 text-primary" />
            <span>Add Product</span>
          </Button>
        </AddProductModal>

        <StockInModal>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold whitespace-nowrap hover:border-black"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
            <span>Stock In</span>
          </Button>
        </StockInModal>

        <StockOutModal>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold whitespace-nowrap hover:border-black"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5 text-amber-600" />
            <span>Stock Out</span>
          </Button>
        </StockOutModal>

        <TransferModal>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold whitespace-nowrap hover:border-black"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
            <span>Transfer</span>
          </Button>
        </TransferModal>

        <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")}
          />
          <span className="hidden lg:inline font-medium">Refresh</span>
        </Button>
      </div>
    </header>
  );
}
