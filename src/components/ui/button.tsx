import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

export function buttonStyles(variant: "primary" | "secondary" = "primary") {
  return cn("ui-button inline-flex min-h-11 items-center justify-center gap-3 rounded-lg px-5 py-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", variant === "primary" ? "bg-accent text-background hover:bg-accent-hover" : "border border-border bg-surface text-foreground hover:border-muted hover:bg-elevated");
}

export function Button({ className, type = "button", variant = "primary", ...props }: ComponentPropsWithRef<"button"> & { variant?: "primary" | "secondary" }) {
  return <button type={type} className={cn(buttonStyles(variant), className)} {...props} />;
}
