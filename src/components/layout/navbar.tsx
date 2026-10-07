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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenMobileSidebar}
          className="h-8 w-8 p-0 md:hidden text-muted-foreground hover:text-foreground"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Link
            href="/"
            className="font-sans font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            StockOS
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
          <span className="font-sans font-semibold text-foreground truncate">
            {currentPageTitle}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <LanguageToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

