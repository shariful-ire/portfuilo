import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

export default function NotFound() {
  return <PageContainer className="py-24"><p className="mb-4 font-mono text-sm text-accent">404 / Page not found</p><h1 className="text-4xl font-semibold tracking-tight">Nothing here just yet.</h1><p className="mt-5 text-muted">The page you’re looking for doesn’t exist.</p><Link href="/" className={`${buttonStyles()} mt-8`}>Back to home <span aria-hidden="true">↗</span></Link></PageContainer>;
}
