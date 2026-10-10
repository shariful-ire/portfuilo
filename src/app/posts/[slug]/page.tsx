import { publicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicPost } from "@/lib/posts/public";
import { PageContainer } from "@/components/layout/page-container";
import { AdminToolbar } from "@/components/auth/admin-toolbar";
import { PostArticle } from "@/components/posts/post-article";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
 let post; try { post = await getPublicPost((await params).slug); } catch { return { title: "Post unavailable", robots: { index: false, follow: false } }; }
 if (!post) return { title: "Post not found", robots: { index: false, follow: false } };
 const title = post.seoTitle || post.title; const description = post.seoDescription || post.excerpt;
 const metadata = await publicMetadata(`/posts/${post.slug}`, title, description, post.cover);
 return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: post.publishedOn ? `${post.publishedOn}T00:00:00.000Z` : undefined, modifiedTime: post.updatedAt, tags: post.tags } };
}
export default async function PostPage({ params }: Props) {
 let post; try { post = await getPublicPost((await params).slug); } catch { return <PageContainer className="py-16"><h1 className="text-3xl font-semibold">Post unavailable</h1><p role="status" className="mt-5 text-muted">This article could not be loaded. Please reload in a moment.</p><Link href="/posts" className="mt-8 inline-block text-accent">Browse posts</Link></PageContainer>; }
 if (!post) notFound();
 return <><AdminToolbar /><PageContainer className="py-16"><Link href="/posts" className="mb-10 inline-block text-accent">All posts</Link><PostArticle post={post} /></PageContainer></>;
}
