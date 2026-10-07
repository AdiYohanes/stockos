"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Warehouse,
  Truck,
  ShoppingBag,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StockOSLogo } from "@/components/stockos-logo";
import { useI18n } from "@/lib/i18n/context";
import type { Translations } from "@/lib/i18n/types";

export interface NavItem {
  titleKey: keyof Translations["nav"];
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { titleKey: "dashboard", href: "/", icon: LayoutDashboard },
  { titleKey: "products", href: "/products", icon: Package },
  { titleKey: "inventory", href: "/inventory", icon: Boxes },
  { titleKey: "warehouses", href: "/warehouses", icon: Warehouse },
  { titleKey: "suppliers", href: "/suppliers", icon: Truck },
  { titleKey: "purchaseOrders", href: "/purchase-orders", icon: ShoppingBag },
  { titleKey: "reports", href: "/reports", icon: BarChart3 },
  { titleKey: "settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ className, onNavigate, isMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 text-sidebar-foreground transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            <StockOSLogo size={18} />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-sm font-semibold tracking-tight text-foreground leading-tight">StockOS</span>
            <span className="font-mono tabular-nums text-[10px] uppercase tracking-wider text-muted-foreground">Mini ERP</span>
          </div>
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseMobile}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t.nav.platform}
        </div>
        <nav className="mt-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const title = t.nav[item.titleKey];

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors border",
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold border-slate-200/80 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300"
                  )}
                />
                <span>{title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info: Calm operational status */}
      <div className="border-t border-border px-3.5 py-2.5 font-mono tabular-nums text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Operational</span>
          </div>
          <span className="text-[10px] text-muted-foreground">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
