"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { logoutMockUser } from "@/features/auth/mock-auth";

export interface SignOutButtonProps
  extends React.ComponentProps<typeof Button>,
    VariantProps<typeof buttonVariants> {
  redirectTo?: string;
}

export function SignOutButton({
  children = "Sign out",
  variant = "outline",
  redirectTo = "/login",
  onClick,
  ...props
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut: React.ComponentProps<typeof Button>["onClick"] = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    setIsSigningOut(true);
    logoutMockUser();
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <Button
      variant={variant}
      onClick={handleSignOut}
      disabled={isSigningOut || props.disabled}
      {...props}
    >
      {isSigningOut ? "Signing out..." : children}
    </Button>
  );
}
