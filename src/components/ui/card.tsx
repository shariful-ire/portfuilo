import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-card min-w-0 rounded-2xl border border-border bg-surface p-6 sm:p-8", className)} {...props} />;
}
