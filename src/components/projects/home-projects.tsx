import Link from "next/link";
import { getPublicProjects } from "@/lib/projects/public";
import { ProjectCard } from "./project-card";
export async function HomeProjects() {
 let result; try { result = await getPublicProjects({ featured: true, limit: 3 }); } catch { /* Honest unavailable state below. */ }
 return <section id="projects" aria-labelledby="projects-title" className="border-b border-border py-16 sm:py-20"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">02 / Projects</p><h2 id="projects-title" className="text-3xl font-semibold">Featured projects</h2><p className="mt-3 text-muted">Web applications, connected devices, and the ideas behind them.</p><div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result?.items.map((project) => <ProjectCard key={project.id} project={project} />)}</div>{!result ? <p role="status" className="mt-6 text-muted">Projects are temporarily unavailable. Please try again later.</p> : !result.items.length && <p className="mt-6 text-muted">No featured projects published yet.</p>}<Link href="/projects" className="mt-8 inline-block text-accent">View all projects</Link></section>;
}
