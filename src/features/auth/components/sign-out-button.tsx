"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { useI18n } from "@/lib/i18n/context";

export function SignOutButton({ children, onClick, disabled, ...props }: React.ComponentProps<typeof Button>) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, setPending] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const handleSignOut: React.ComponentProps<typeof Button>["onClick"] = async (e) => {
    onClick?.(e);
    if (e.defaultPrevented || pending) return;
    setPending(true);
    setFailed(false);
    try {
      const result = await signOut();
      if (!result.ok) {
        setFailed(true);
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button {...props} onClick={handleSignOut} disabled={pending || disabled}>
        {pending ? t.common.loading : children ?? t.nav.logout}
      </Button>
      {failed && <p role="alert" className="max-w-48 text-xs text-destructive">{t.auth.logoutFailed}</p>}
    </div>
  );
}
