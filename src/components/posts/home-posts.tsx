import Link from "next/link";
import { getPublicPosts } from "@/lib/posts/public";
import { PostCard } from "./post-card";
export async function HomePosts() {
 let result; try { result = await getPublicPosts({ limit: 3 }); } catch { /* Honest unavailable state below. */ }
 return <section id="posts" aria-labelledby="posts-title" className="border-b border-border py-16 sm:py-20"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">04 / Posts</p><h2 id="posts-title" className="text-3xl font-semibold">Latest posts</h2><p className="mt-3 text-muted">Notes on web development, IoT, and robotics.</p><div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result?.items.map((post) => <PostCard key={post.id} post={post} />)}</div>{!result ? <p role="status" className="mt-6 text-muted">Posts are temporarily unavailable. Please try again later.</p> : !result.items.length && <p className="mt-6 text-muted">No posts published yet.</p>}<Link href="/posts" className="section-listing-action mt-8 inline-block text-accent">View all posts</Link></section>;
}
