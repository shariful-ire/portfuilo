import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { PostView } from "@/lib/posts/schema";
export function PostCard({ post }: { post: PostView }) {
 return <Card>{post.cover && <Image sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) 45vw, 350px" src={post.cover.url} alt={post.cover.alt} width={800} height={500} className="mb-6 aspect-video w-full rounded-lg object-cover" />}<p className="mb-3 text-sm text-muted">{post.publishedOn && <><time dateTime={post.publishedOn}>{post.publishedOn}</time> / </>}{post.readingMinutes} min read</p><h2 className="text-2xl font-semibold"><Link href={`/posts/${post.slug}`} className="hover:text-accent">{post.title}</Link></h2><p className="mt-4 leading-7 text-muted">{post.excerpt}</p><ul aria-label="Tags" className="mt-5 flex flex-wrap gap-3">{post.tags.map((tag) => <li key={tag}><Link href={`/posts?tag=${encodeURIComponent(tag)}`} className="text-sm text-accent">{tag}</Link></li>)}</ul><Link href={`/posts/${post.slug}`} className="mt-6 inline-block text-sm text-accent" aria-label={`Read ${post.title}`}>Read article</Link></Card>;
}
