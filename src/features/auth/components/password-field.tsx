"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  label: string;
  error?: string;
}

/**
 * Password field with visibility toggle.
 * Extends the same pattern as FormField but adds an eye/eye-off toggle button.
 */
function PasswordField({
  label,
  error,
  id,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          id={fieldId}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="pr-9"
          {...inputProps}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
        </Button>
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export { PasswordField };
export type { PasswordFieldProps };
