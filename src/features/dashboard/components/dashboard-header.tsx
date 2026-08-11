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

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleQuickAction = (actionName: string) => {
    setActionFeedback(`${actionName} triggered`);
    setTimeout(() => {
      setActionFeedback(null);
    }, 2500);
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickAction("Add Product")}
          className="gap-1.5 text-xs font-semibold whitespace-nowrap hover:border-black"
        >
          <PackagePlus className="h-3.5 w-3.5 text-primary" />
          <span>Add Product</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickAction("Stock In")}
          className="gap-1.5 text-xs font-semibold whitespace-nowrap hover:border-black"
        >
          <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
          <span>Stock In</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickAction("Stock Out")}
          className="gap-1.5 text-xs font-semibold whitespace-nowrap hover:border-black"
        >
          <ArrowUpFromLine className="h-3.5 w-3.5 text-amber-600" />
          <span>Stock Out</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickAction("Transfer")}
          className="gap-1.5 text-xs font-semibold whitespace-nowrap hover:border-black"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
          <span>Transfer</span>
        </Button>

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

      {actionFeedback && (
        <div className="absolute -top-8 right-0 z-20 rounded-md border border-black bg-foreground px-2.5 py-1 font-mono text-xs font-semibold text-background shadow-neo-sm animate-in fade-in">
          {actionFeedback}
        </div>
      )}
    </header>
  );
}
