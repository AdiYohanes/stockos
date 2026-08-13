"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { logoutMockUser } from "@/features/auth/mock-auth";
import type { MockUser } from "@/features/auth/types";

interface UserMenuProps {
  user: MockUser | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { language, t } = useI18n();

  const handleSignOut = () => {
    setIsLoggingOut(true);
    logoutMockUser();
    router.push("/login");
    router.refresh();
  };

  const displayName = user?.name || "Demo User";
  const displayEmail = user?.email || "demo@stockos.com";
  const displayRole = user?.role || "admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-[#ede9fe] font-mono text-xs font-bold text-[#543afd] shadow-neo-sm">
          {initials || <UserIcon className="h-4 w-4" />}
        </div>
        <div className="hidden flex-col text-left sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">{displayName}</span>
            <span className="rounded-sm border border-black bg-muted px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {displayRole}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">{displayEmail}</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={isLoggingOut}
        className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        title={t.nav.logout}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden md:inline">
          {isLoggingOut
            ? language === "id"
              ? "Keluar..."
              : "Signing out..."
            : t.nav.logout}
        </span>
      </Button>
    </div>
  );
}
