"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
    }

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        <div className={cn(
          "w-11 h-6 bg-zinc-200 rounded-full peer dark:bg-zinc-700",
          "peer-focus:ring-4 peer-focus:ring-zinc-300 dark:peer-focus:ring-zinc-800",
          "peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full",
          "peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px]",
          "after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5",
          "after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-50",
          className
        )} />
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }

