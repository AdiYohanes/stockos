"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onCheckedChange?.(!checked);
      onClick?.(e);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        ref={ref}
        onClick={handleClick}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#543afd] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-[#543afd] shadow-neo-sm" : "bg-slate-200",
          className
        )}
        {...props}
      >
        <span
          data-state={checked ? "checked" : "unchecked"}
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white border border-black shadow-sm ring-0 transition-transform",
            checked ? "translate-x-5 bg-white" : "translate-x-0.5"
          )}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";
