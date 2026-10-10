import Image from "next/image";
import { MarkdownBody } from "./markdown-body";
import type { PostView } from "@/lib/posts/schema";
export function PostArticle({ post, preview = false }: { post: PostView; preview?: boolean }) {
 return <article className="mx-auto max-w-3xl"><header><p className="text-sm text-muted">{post.publishedOn && <><time dateTime={post.publishedOn}>{post.publishedOn}</time> / </>}{post.readingMinutes} min read (estimate)</p>{preview ? <h2 className="mt-4 text-4xl font-semibold">{post.title}</h2> : <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{post.title}</h1>}<p className="mt-6 text-lg leading-8 text-muted">{post.excerpt}</p>{post.cover && <Image sizes="(max-width: 767px) calc(100vw - 48px), 960px" src={post.cover.url} alt={post.cover.alt} width={1200} height={750} className="mt-8 h-auto w-full rounded-xl" />}<ul aria-label="Tags" className="my-6 flex flex-wrap gap-3">{post.tags.map((tag, index) => <li key={`${tag}-${index}`} className="text-sm text-accent">{tag}</li>)}</ul></header><MarkdownBody body={post.markdown} /></article>;
}
