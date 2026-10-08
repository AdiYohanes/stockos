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
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        "hidden md:flex w-[240px] shrink-0 h-screen sticky top-0 bg-card border-r-[3px] border-border flex-col z-40",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b-[3px] border-border flex items-center gap-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 hover:opacity-90"
        >
          <div className="w-10 h-10 bg-primary shadow-hard-sm flex items-center justify-center">
            <StockOSLogo size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-[900] text-xl tracking-tighter block leading-none text-foreground uppercase">StockOS</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-foreground/80 mt-1">Mini ERP</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground px-3 mb-4">
          {t.nav.platform}
        </p>
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
                "flex items-center gap-3 px-3 py-3 border-[3px] font-heading font-bold uppercase text-xs transition-colors",
                isActive
                  ? "bg-primary border-border shadow-hard-sm text-primary-foreground"
                  : "border-transparent text-foreground hover:bg-primary hover:border-border hover:text-primary-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t-[3px] border-border bg-background">
        <div className="flex items-center gap-3 px-3 py-2 font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest">
          <span className="w-2 h-2 bg-status-healthy border border-border shrink-0" />
          <span className="text-foreground">Operational</span>
        </div>
      </div>
    </aside>
  );
}

