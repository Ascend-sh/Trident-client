import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitives.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand data-[state=unchecked]:bg-surface-lighter",
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm ring-0 transition-all data-[state=checked]:translate-x-3.5 data-[state=unchecked]:translate-x-0 data-[state=checked]:bg-surface"
        )}
      />
    </SwitchPrimitives.Root>
  )
}

export { Switch }
