import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
export default function PostNotFound() { return <PageContainer className="py-16"><h1 className="text-3xl font-semibold">Post not found</h1><p className="mt-5 text-muted">No published post is available at this address.</p><Link href="/posts" className="mt-8 inline-block text-accent">Browse posts</Link></PageContainer>; }
