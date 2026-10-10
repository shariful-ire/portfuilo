import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const fieldStyles = "w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldStyles, className)} {...props} />;
}
