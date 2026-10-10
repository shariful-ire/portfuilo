import { PageContainer } from "@/components/layout/page-container";

export default function Loading() {
  return <PageContainer className="py-24"><div role="status" aria-live="polite"><p className="text-muted">Loading portfolio…</p><div aria-hidden="true" className="mt-8 max-w-2xl space-y-5 motion-safe:animate-pulse"><div className="h-12 rounded-lg bg-elevated" /><div className="h-12 w-3/4 rounded-lg bg-elevated" /><div className="h-24 rounded-lg bg-surface" /></div></div></PageContainer>;
}
