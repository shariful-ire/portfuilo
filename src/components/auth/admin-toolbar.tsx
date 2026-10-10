import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { AuthButton } from "./auth-buttons";
import { PageContainer } from "@/components/layout/page-container";

export async function AdminToolbar() {
  try { await requireAdmin(); } catch { return null; }
  return <aside aria-label="Admin toolbar" className="border-b border-accent/30 bg-surface"><PageContainer className="flex flex-wrap items-center justify-between gap-3 py-3"><Link href="/dashboard" className="text-sm font-semibold text-accent">Admin dashboard <span aria-hidden="true">↗</span></Link><AuthButton action="sign-out" /></PageContainer></aside>;
}
