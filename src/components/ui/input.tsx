import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-card px-3.5 py-2 text-base text-foreground transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-base placeholder:text-muted-foreground focus:border-black focus:outline-none focus:shadow-[2px_2px_0px_#543afd] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[2px_2px_0px_#ef4444]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
