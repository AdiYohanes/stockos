"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface FormFieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
}

/**
 * Reusable form field that pairs a Label with an Input.
 * Supports error messages with icon (not color-only) and aria-describedby.
 */
function FormField({
  label,
  error,
  id,
  className,
  ...inputProps
}: FormFieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
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

export { FormField };
export type { FormFieldProps };
