"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { OwnerUser } from "@/features/auth/types";

interface UserMenuProps {
  user: OwnerUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useI18n();
  const displayName = user.name;
  const displayEmail = user.email;
  const displayRole = t.auth.ownerRole;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-100 font-mono tabular-nums text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {initials || <UserIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />}
        </div>
        <div className="hidden flex-col text-left sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground">{displayName}</span>
            <span className="rounded-sm border border-slate-200 bg-slate-100 px-1 py-0.2 font-mono tabular-nums text-[9px] font-medium uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
              {displayRole}
            </span>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{displayEmail}</span>
        </div>
      </div>

      <SignOutButton
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        title={t.nav.logout}
        aria-label={t.nav.logout}
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden md:inline">{t.nav.logout}</span>
      </SignOutButton>
    </div>
  );
}
