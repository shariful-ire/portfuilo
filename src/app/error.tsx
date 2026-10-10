"use client";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageContainer className="py-24"><p className="mb-4 text-sm text-accent">Something went wrong</p><h1 className="text-4xl font-semibold tracking-tight">This page couldn’t load.</h1><p className="mt-5 text-muted">Please try again in a moment.</p><Button onClick={reset} className="mt-8">Try again</Button></PageContainer>;
}
