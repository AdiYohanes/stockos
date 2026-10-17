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
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center border-[2px] border-ink bg-paper font-mono tabular-nums text-xs font-bold text-ink">
          {initials || <UserIcon className="h-3.5 w-3.5 text-ink" />}
        </div>
        <div className="hidden min-w-0 max-w-[180px] xl:max-w-none flex-col text-left sm:flex">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs font-bold text-foreground">{displayName}</span>
            <span className="shrink-0 border border-ink/40 bg-paper px-1 py-0.5 font-mono tabular-nums text-[9px] font-bold uppercase tracking-wider text-ink/70">
              {displayRole}
            </span>
          </div>
          <span className="truncate text-[11px] font-mono tabular-nums text-muted-foreground">{displayEmail}</span>
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
