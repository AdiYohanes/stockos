import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center cursor-pointer rounded-none border-[3px] bg-clip-padding font-bold uppercase whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive press transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-border shadow-hard-sm hover:bg-primary-hover",
        outline:
          "border-border bg-card text-foreground shadow-hard-sm hover:bg-acid hover:text-white aria-expanded:bg-acid aria-expanded:text-white",
        secondary:
          "bg-foreground text-background border-border shadow-hard-sm hover:bg-foreground aria-expanded:bg-foreground",
        ghost:
          "border-transparent hover:bg-acid hover:text-white hover:border-border hover:shadow-hard-sm aria-expanded:bg-acid aria-expanded:text-white aria-expanded:border-border",
        destructive:
          "bg-destructive text-destructive-foreground border-border shadow-hard-sm hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none press-none",
      },
      size: {
        default:
          "h-10 gap-2 px-4 text-xs has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 px-2.5 text-[10px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2.5 px-6 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9",
        "icon-lg": "size-12",
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
