import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ProjectView } from "@/lib/projects/schema";
export function ProjectCard({ project, preview = false }: { project: ProjectView; preview?: boolean }) {
 return <Card className="flex h-full flex-col"><div>{project.thumbnail && <Image sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) 45vw, 350px" src={project.thumbnail.url} alt={project.thumbnail.alt} width={800} height={500} className="mb-6 aspect-video w-full rounded-lg object-cover" />}<p className="mb-3 text-xs uppercase tracking-widest text-accent">{project.category}</p><h2 className="text-2xl font-semibold">{preview ? project.title : <Link href={`/projects/${project.slug}`} className="hover:text-accent">{project.title}</Link>}</h2><p className="mt-4 leading-7 text-muted">{project.summary}</p></div><ul aria-label="Technologies" className="mt-5 flex flex-wrap gap-2">{project.technologies.map((tag, index) => <li key={`${tag}-${index}`} className="rounded border border-border px-2 py-1 text-xs text-muted">{tag}</li>)}</ul>{!preview && <Link href={`/projects/${project.slug}`} className="mt-6 text-sm text-accent" aria-label={`Explore ${project.title}`}>Explore project</Link>}</Card>;
}
