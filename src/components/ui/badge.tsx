import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm border border-black px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors select-none",
  {
    variants: {
      variant: {
        default: "bg-[#ede9fe] text-[#543afd]",
        secondary: "bg-[#09090b] text-white",
        outline: "bg-card text-foreground",
        success: "bg-[#dcfce7] text-[#15803d]",
        warning: "bg-[#fef3c7] text-[#b45309]",
        destructive: "bg-[#fee2e2] text-[#b91c1c]",
        neutral: "bg-[#f1f5f9] text-[#0f172a]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
