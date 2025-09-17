import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => (
    <label className={cn("inline-flex items-center", disabled && "opacity-50")}>
      <span className="relative inline-block h-6 w-11">
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          {...props}
        />
        <span
          className={cn(
            "absolute inset-0 rounded-full transition-colors",
            "bg-gray-300 peer-checked:bg-black"
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-0 h-6 w-6 transform rounded-full bg-white shadow transition-transform",
            "peer-checked:translate-x-5"
          )}
        />
      </span>
    </label>
  )
);
Switch.displayName = "Switch";
