import { publicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProject } from "@/lib/projects/public";
import { PageContainer } from "@/components/layout/page-container";
import { AdminToolbar } from "@/components/auth/admin-toolbar";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
 let project;
 try { project = await getPublicProject((await params).slug); }
 catch { return { title: "Project unavailable", robots: { index: false, follow: false } }; }
 if (!project) return { title: "Project not found", robots: { index: false, follow: false } };
 return publicMetadata(`/projects/${project.slug}`, project.title, project.summary, project.thumbnail);
}
export default async function ProjectPage({ params }: Props) {
 let project;
 try { project = await getPublicProject((await params).slug); }
 catch { return <PageContainer className="py-16"><h1 className="text-3xl font-semibold">Project unavailable</h1><p role="status" className="mt-5 text-muted">The project could not be loaded. Please reload this page in a moment.</p><Link href="/projects" className="mt-8 inline-block text-accent">Browse projects</Link></PageContainer>; }
 if (!project) notFound();
 return <><AdminToolbar /><PageContainer className="max-w-5xl py-16"><Link href="/projects" className="text-sm text-accent">All projects</Link><article><p className="mt-10 text-sm text-accent">{project.category}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">{project.title}</h1><p className="mt-6 text-xl leading-8 text-muted">{project.summary}</p>{project.thumbnail && <Image sizes="(max-width: 767px) calc(100vw - 48px), 960px" src={project.thumbnail.url} alt={project.thumbnail.alt} width={1200} height={750} className="mt-10 h-auto w-full rounded-2xl" priority />}<ul aria-label="Technologies" className="my-8 flex flex-wrap gap-3">{project.technologies.map((tag, index) => <li key={`${tag}-${index}`} className="rounded border border-border px-3 py-1 text-sm">{tag}</li>)}</ul><div className="flex flex-wrap gap-5">{([["GitHub", project.repositoryUrl], ["Live demo", project.liveUrl], ["Watch video", project.videoUrl]] as const).map(([label, url]) => url && <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="text-accent">{label}</a>)}</div>{([["Overview", project.description], ["The problem", project.problem], ["The solution", project.solution], ["My contribution", project.contribution], ["Challenges", project.challenges], ["Lessons learned", project.lessons]] as const).map(([heading, text]) => text && <section key={heading} className="mt-12"><h2 className="text-2xl font-semibold">{heading}</h2><p className="mt-4 whitespace-pre-line leading-8 text-muted">{text}</p></section>)}{!!project.features.length && <section className="mt-12"><h2 className="text-2xl font-semibold">Features</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-muted">{project.features.map((feature, index) => <li key={index}>{feature}</li>)}</ul></section>}{!!project.gallery.length && <section className="mt-12"><h2 className="text-2xl font-semibold">Gallery</h2><div className="mt-6 grid gap-6 sm:grid-cols-2">{project.gallery.map((image, index) => <a key={index} href={image.url} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size image: ${image.alt}`}><Image sizes="(max-width: 767px) calc(100vw - 48px), 960px" src={image.url} alt={image.alt} width={900} height={650} className="h-auto w-full rounded-xl" /></a>)}</div></section>}</article></PageContainer></>;
}
