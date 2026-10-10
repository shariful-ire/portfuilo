import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/page-access";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { PageContainer } from "@/components/layout/page-container";
import { AuthButton } from "@/components/auth/auth-buttons";
export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <PageContainer className="py-10"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><p className="font-mono text-sm text-accent">Portfolio / Administration</p><AuthButton action="sign-out" /></div><div className="grid gap-8 md:grid-cols-[200px_1fr]"><aside className="border-b border-border pb-4 md:border-r md:border-b-0 md:pr-4"><DashboardNav /></aside><div className="min-w-0">{children}</div></div></PageContainer>;
}
