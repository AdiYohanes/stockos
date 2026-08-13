"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { NAV_ITEMS } from "@/components/layout/sidebar";
import type { MockUser } from "@/features/auth/types";

interface NavbarProps {
  user: MockUser | null;
  onOpenMobileSidebar: () => void;
}

export function Navbar({ user, onOpenMobileSidebar }: NavbarProps) {
  const pathname = usePathname();

  const currentNav = NAV_ITEMS.find((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  const currentPageTitle = currentNav ? currentNav.title : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenMobileSidebar}
          className="h-9 w-9 p-0 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Link
            href="/"
            className="font-heading font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            StockOS
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          <span className="font-heading font-semibold text-foreground truncate">
            {currentPageTitle}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <UserMenu user={user} />
      </div>
    </header>
  );
}

