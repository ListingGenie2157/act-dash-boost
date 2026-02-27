import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] hover:bg-white/[0.09] hover:border-white/[0.14] hover:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.10)]",
        destructive: "bg-destructive/80 backdrop-blur-xl border border-destructive/30 text-destructive-foreground shadow-[0_8px_32px_rgba(244,63,94,0.15)] hover:bg-destructive/90 hover:shadow-[0_8px_32px_rgba(244,63,94,0.25)]",
        outline: "border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] text-foreground",
        secondary: "bg-white/[0.04] backdrop-blur-xl border border-[rgba(45,212,191,0.15)] text-secondary-foreground hover:bg-[rgba(45,212,191,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        success: "bg-success/80 backdrop-blur-xl border border-success/30 text-success-foreground shadow-[0_8px_32px_rgba(45,212,191,0.12)] hover:bg-success/90 hover:shadow-[0_8px_32px_rgba(45,212,191,0.2)]",
        warning: "bg-warning/80 backdrop-blur-xl border border-warning/30 text-warning-foreground hover:bg-warning/90",
        ghost: "hover:bg-white/[0.05] text-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-white/[0.06] backdrop-blur-xl border border-[rgba(45,212,191,0.2)] text-white shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(45,212,191,0.12),inset_0_1px_0_rgba(255,255,255,0.10)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_50px_rgba(45,212,191,0.2),inset_0_1px_0_rgba(255,255,255,0.14)] hover:border-[rgba(45,212,191,0.3)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
