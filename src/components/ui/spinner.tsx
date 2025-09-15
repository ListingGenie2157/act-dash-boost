// export only what you actually have in /src/components/ui
export { Button } from "./button";
export { Input } from "./input";
export { Label } from "./label";
export { Switch } from "./switch";

// shadcn/Radix Select re-exports
export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
} from "./select";

// optional: spinner if you added it
export { LoadingSpinner } from "./spinner";
import { cn } from "@/lib/utils";
export function LoadingSpinner({ className }: { className?: string }) {
  return <div className={cn("h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground", className)} />;
}
