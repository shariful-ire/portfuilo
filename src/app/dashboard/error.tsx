"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="p-8"><h1 className="text-2xl font-semibold">Dashboard unavailable</h1><p role="alert" className="my-6 text-muted">The requested content could not be loaded. Please try again.</p><Button onClick={reset}>Try again</Button></div>; }
