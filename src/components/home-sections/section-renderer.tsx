import { SectionHeading } from "@/components/ui/section-heading";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import type { HomepageSectionType, SectionContent } from "@/lib/content/sections";
import type { ResolvedContent, ResolvedSection } from "@/lib/home-manager/view-types";
import { ProjectCard } from "@/components/projects/project-card";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { PostCard } from "@/components/posts/post-card";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
function Blocks({ blocks }: { blocks: SectionContent<"rich-text">["blocks"] }) {
 return <div className="space-y-5">{blocks.map((block, index) => block.type === "heading" ? <h3 key={index} className="text-2xl font-semibold">{block.text}</h3> : block.type === "quote" ? <blockquote key={index} className="whitespace-pre-line border-l-2 border-accent pl-5 leading-8 text-muted">{block.text}</blockquote> : <p key={index} className="whitespace-pre-line leading-8 text-muted">{block.text}</p>)}</div>;
}
type Props = { content: ResolvedContent };
const empty = <p className="text-muted">No published content available for this section yet.</p>;
const grid = "grid gap-6 md:grid-cols-2 lg:grid-cols-3";
export const homepageComponents = {
 "rich-text": ({ content }: Props) => content.type === "rich-text" ? <Blocks blocks={content.blocks} /> : null,
 "image-and-text": ({ content }: Props) => content.type === "image-and-text" ? <div className="grid items-center gap-8 md:grid-cols-2">{content.image && <Image sizes="(max-width: 767px) calc(100vw - 48px), 960px" src={content.image.url} alt={content.image.alt} width={1000} height={750} className={`h-auto w-full rounded-xl ${content.imageSide === "right" ? "md:order-2" : ""}`} />}<Blocks blocks={content.blocks} /></div> : null,
 gallery: ({ content }: Props) => content.type === "gallery" ? <div className={grid}>{content.images.map((image, index) => <figure key={index}><a href={image.url} target="_blank" rel="noopener noreferrer" aria-label={`View full image: ${image.alt}`}><Image sizes="(max-width: 767px) calc(100vw - 48px), 960px" src={image.url} alt={image.alt} width={800} height={600} className="h-auto w-full rounded-xl" /></a>{image.caption && <figcaption className="mt-3 text-sm text-muted">{image.caption}</figcaption>}</figure>)}</div> : null,
 projects: ({ content }: Props) => content.type === "projects" ? <>{content.items.length ? <div className={grid}>{content.items.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : empty}<Link href="/projects" className="section-action mt-6">All projects</Link></> : null,
 certificates: ({ content }: Props) => content.type === "certificates" ? <>{content.items.length ? <div className={grid}>{content.items.map((certificate) => <CertificateCard key={certificate.id} certificate={certificate} />)}</div> : empty}<Link href="/certificates" className="section-action mt-6">All certificates</Link></> : null,
 posts: ({ content }: Props) => content.type === "posts" ? <>{content.items.length ? <div className={grid}>{content.items.map((post) => <PostCard key={post.id} post={post} />)}</div> : empty}<Link href="/posts" className="section-action mt-6">All posts</Link></> : null,
 skills: ({ content }: Props) => content.type === "skills" ? content.items.length ? <div className={grid}>{content.items.map((item) => <Card key={item.id}><h3 className="text-xl font-semibold">{item.name}</h3>{item.category && <p className="mt-2 text-sm text-accent">{item.category}</p>}{item.description && <p className="mt-4 whitespace-pre-line leading-7 text-muted">{item.description}</p>}</Card>)}</div> : empty : null,
 timeline: ({ content }: Props) => content.type === "timeline" ? content.items.length ? <ol className="space-y-6 border-l border-border pl-6">{content.items.map((item) => <li key={item.id}><p className="text-sm capitalize text-accent">{item.kind}</p><h3 className="mt-2 text-xl font-semibold">{item.title}</h3><p className="mt-2 text-muted">{item.organization}</p>{(item.startMonth || item.endMonth || item.current) && <p className="mt-2 text-sm text-muted">{item.startMonth && <time dateTime={item.startMonth}>{item.startMonth}</time>}{item.startMonth && (item.endMonth || item.current) && " - "}{item.current ? "Present" : item.endMonth && <time dateTime={item.endMonth}>{item.endMonth}</time>}</p>}{item.description && <p className="mt-4 whitespace-pre-line leading-8 text-muted">{item.description}</p>}</li>)}</ol> : empty : null,
 cta: ({ content }: Props) => content.type === "cta" ? <Card><p className="mb-6 whitespace-pre-line leading-8 text-muted">{content.body}</p><a href={content.action.href} className={buttonStyles()}>{content.action.label}</a></Card> : null,
} satisfies Record<HomepageSectionType, ComponentType<Props>>;
export function SectionRenderer({ section }: { section: ResolvedSection }) {
 const Component = homepageComponents[section.content.type];
 return <section id={`section-${section.id}`} aria-labelledby={`section-title-${section.id}`} className="border-b border-border py-16 sm:py-20"><SectionHeading id={`section-title-${section.id}`} icon={section.content.type}>{section.title}</SectionHeading>{section.subtitle && <p className="mt-3 leading-7 text-muted">{section.subtitle}</p>}<div className="mt-8"><Component content={section.content} /></div></section>;
}
