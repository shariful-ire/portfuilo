import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldStyles } from "./input";

export function Textarea({ className, rows = 5, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(fieldStyles, "min-h-32 resize-y", className)} {...props} />;
}
