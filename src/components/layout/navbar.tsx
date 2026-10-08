"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { NAV_ITEMS } from "@/components/layout/sidebar";
import { useI18n } from "@/lib/i18n/context";
import type { MockUser } from "@/features/auth/types";

interface NavbarProps {
  user: MockUser | null;
  onOpenMobileSidebar: () => void;
}

export function Navbar({ user, onOpenMobileSidebar }: NavbarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const currentNav = NAV_ITEMS.find((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  const currentPageTitle = currentNav ? t.nav[currentNav.titleKey] : t.nav.dashboard;

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b-[3px] border-border bg-card px-5 md:px-8">
      <div className="flex items-center gap-4 flex-1">
        {/* We use Mobile Nav (bottom), but keep a button just in case we need mobile menus, or we can hide it */}
        <div className="md:hidden flex items-center gap-2">
          <span className="w-8 h-8 bg-primary border-[2px] border-border flex items-center justify-center">
             {/* Just a tiny square indicator for mobile header */}
             <div className="w-4 h-4 bg-foreground" />
          </span>
          <span className="font-heading font-[900] text-lg uppercase">StockOS</span>
        </div>

        {/* Breadcrumbs for desktop */}
        <div className="hidden md:flex items-center gap-4">
          <h1 className="font-heading font-[900] uppercase tracking-tighter text-2xl">
            {currentPageTitle}
          </h1>
          <span className="bg-primary border-[2px] border-border px-2 py-1 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white">
            <i className="w-1.5 h-1.5 bg-white"></i>Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageToggle />
        <span className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-foreground/50">
          {user?.name || "Demo User"} / {user?.role || "Admin"}
        </span>
        <UserMenu user={user} />
      </div>
    </header>
  );
}


