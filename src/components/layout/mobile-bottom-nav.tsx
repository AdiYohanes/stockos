"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

// We select top 4 items for mobile bottom nav
const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t-[3px] border-border flex">
      {MOBILE_NAV_ITEMS.map((item) => {
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
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 font-mono text-[8px] uppercase border-t-[3px] border-transparent transition-colors",
              isActive
                ? "bg-primary border-border text-primary-foreground font-bold"
                : "text-foreground/70 hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
