import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-all duration-100 outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-[1.5px] border-black shadow-neo-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-neo hover:bg-[#462ee0] active:translate-x-px active:translate-y-px active:shadow-none",
        black:
          "bg-[#09090b] text-white border-[1.5px] border-black shadow-neo-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-neo hover:bg-[#18181b] active:translate-x-px active:translate-y-px active:shadow-none",
        secondary:
          "bg-muted text-foreground border border-border hover:bg-slate-200/80 active:translate-y-px",
        outline:
          "border border-border bg-card text-foreground hover:bg-muted active:translate-y-px",
        ghost:
          "hover:bg-muted hover:text-foreground active:translate-y-px",
        destructive:
          "bg-destructive text-white border-[1.5px] border-black shadow-neo-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-neo active:translate-x-px active:translate-y-px active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-3.5 text-sm",
        xs: "h-7 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-4 text-sm font-semibold",
        icon: "size-9",
        "icon-xs": "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
