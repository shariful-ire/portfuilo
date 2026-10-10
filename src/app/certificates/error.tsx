"use client";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
export default function ErrorPage({ reset }: { reset: () => void }) { return <PageContainer className="py-16"><h1 className="text-3xl font-semibold">Certificates unavailable</h1><p role="alert" className="my-6 text-muted">Please try again in a moment.</p><Button onClick={reset}>Try again</Button></PageContainer>; }
