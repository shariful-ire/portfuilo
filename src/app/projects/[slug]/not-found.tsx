import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
export default function ProjectNotFound() { return <PageContainer className="py-16"><h1 className="text-3xl font-semibold">Project not found</h1><p className="mt-5 text-muted">No published project is available at this address.</p><Link href="/projects" className="mt-8 inline-block text-accent">Browse projects</Link></PageContainer>; }
