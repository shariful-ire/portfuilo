import type { Metadata } from "next";
import Link from "next/link";
import { AuthButton } from "@/components/auth/auth-buttons";
import { PageContainer } from "@/components/layout/page-container";
export const metadata: Metadata = { title: "Access denied", robots: { index: false, follow: false } };
export default function AccessDenied() {
  return <PageContainer className="max-w-xl py-20"><p className="mb-3 text-sm text-accent">Restricted access</p><h1 className="text-3xl font-semibold">Access denied</h1><p className="my-6 leading-7 text-muted">This account does not have permission to administer the site. Sign out to choose another Google account.</p><AuthButton action="sign-out" /><Link href="/" className="mt-6 inline-block text-accent">Return to portfolio</Link></PageContainer>;
}
