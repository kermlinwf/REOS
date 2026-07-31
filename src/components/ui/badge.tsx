import * as React from "react";
import { cn } from "@/lib/utils";

export const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "success" | "warning" | "muted" | "destructive";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    muted: "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
    destructive: "bg-red-100 text-red-800",
  };
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";
