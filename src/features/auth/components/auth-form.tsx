"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { AuthFormState } from "@/features/auth/types";

interface AuthFormProps {
  /** Form heading */
  title: string;
  /** Optional subheading */
  description?: string;
  /** Submit button label */
  submitLabel: string;
  /** Current form state */
  state: AuthFormState;
  /** Called on form submit */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Form fields */
  children: React.ReactNode;
  /** Footer content (links) */
  footer?: React.ReactNode;
}

/**
 * Shared form wrapper for all auth pages.
 * Handles loading/error/success states consistently.
 */
function AuthForm({
  title,
  description,
  submitLabel,
  state,
  onSubmit,
  children,
  footer,
}: AuthFormProps) {
  const isLoading = state.status === "loading";
  const isSuccess = state.status === "success";

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {state.message}
        </div>
      )}

      {isSuccess && state.message && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2.5 text-sm text-green-700 dark:text-green-400"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {state.message}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        className={cn(isSuccess && "pointer-events-none opacity-60")}
      >
        <fieldset disabled={isLoading} className="space-y-4">
          {children}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </fieldset>
      </form>

      {footer && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

export { AuthForm };
export type { AuthFormProps };
