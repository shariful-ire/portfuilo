"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
export default function PostError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <PageContainer className="py-16"><h1 className="text-3xl font-semibold">Post unavailable</h1><p role="alert" className="mt-5 text-muted">The post could not be loaded. Please try again in a moment.</p><div className="mt-8 flex items-center gap-5"><Button onClick={reset}>Try again</Button><Link href="/posts" className="text-accent">All posts</Link></div></PageContainer>;
}
