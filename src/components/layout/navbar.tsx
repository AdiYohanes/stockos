"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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

  const title = currentNav ? currentNav.title : "StockOS";

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
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
