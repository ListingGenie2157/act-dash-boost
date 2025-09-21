import * as React from "react";
import { Toaster as Sonner, toast } from "sonner";

export type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Vite-safe Sonner Toaster. No next-themes dependency. */
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="system"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border",
        description: "group-[.toaster]:text-muted-foreground",
        actionButton:
          "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
        cancelButton:
          "group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground"
      }
    }}
    {...props}
  />
);

export { Toaster, toast };
