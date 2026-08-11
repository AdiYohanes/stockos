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
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StockOSLogo } from "@/components/stockos-logo";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Products", href: "/products", icon: Package },
  { title: "Inventory", href: "/inventory", icon: Boxes },
  { title: "Warehouses", href: "/warehouses", icon: Warehouse },
  { title: "Suppliers", href: "/suppliers", icon: Truck },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ className, onNavigate, isMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 font-semibold text-sidebar-foreground transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white border border-black shadow-neo-sm">
            <StockOSLogo size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-sm font-bold tracking-tight text-foreground">StockOS</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Mini ERP</span>
          </div>
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseMobile}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Platform
        </div>
        <nav className="mt-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-[#543afd] text-white border-[1.5px] border-black shadow-neo-sm font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-foreground active:translate-y-px"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-white" : "text-slate-500"
                  )}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="border-t border-border p-4 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>v0.1.0</span>
          <span className="inline-flex items-center rounded-sm border border-black bg-[#dcfce7] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#15803d]">
            Dev Mode
          </span>
        </div>
      </div>
    </aside>
  );
}
