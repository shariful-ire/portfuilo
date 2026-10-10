import "server-only";
import { readingMinutes } from "./markdown";
import { cache } from "react";
import { z } from "zod";
import type { Filter } from "mongodb";
import type { Post } from "../content/models";
import { slugSchema } from "../content/models";
import { getCollection } from "../db/collections";
import { parsePublicRecord, getPublishedMedia } from "../db/public-read";
import { DatabaseUnavailableError } from "../db/connection";
import { type PostView } from "./schema";
export const postQuerySchema = z.object({ q: z.string().trim().max(100).default(""), tag: z.string().trim().max(50).default(""), page: z.number().int().min(1).max(1000).default(1), limit: z.number().int().min(1).max(24).default(12) });
export function postFilter(options: z.input<typeof postQuerySchema> = {}): Filter<Post> {
 const { q, tag } = postQuerySchema.parse(options);
 const literal = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
 return { status: "published", ...(tag ? { tags: tag } : {}), ...(q ? { $or: [{ title: { $regex: literal, $options: "i" } }, { excerpt: { $regex: literal, $options: "i" } }, { tags: { $regex: literal, $options: "i" } }] } : {}) };
}
export async function toPublicPostView(row: Post): Promise<PostView> {
 const p = parsePublicRecord("posts", row);
 const asset = p.coverMediaId ? await getPublishedMedia(p.coverMediaId) : null;
 const markdown = p.markdown ?? p.body.map((block) => block.text).join("\n\n");
 return { id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, markdown, tags: p.tags, publishedOn: p.publishedOn, updatedAt: p.updatedAt, seoTitle: p.seoTitle, seoDescription: p.seoDescription, cover: asset?.kind === "image" ? { url: asset.url, alt: p.coverAlt ?? asset.alt } : undefined, readingMinutes: readingMinutes(markdown) };
}
export async function getPublicPosts(options: z.input<typeof postQuerySchema> = {}) {
 const parsed = postQuerySchema.parse(options);
 try {
   const collection = await getCollection("posts"); const filter = postFilter(parsed);
   const [rows, total, tags] = await Promise.all([collection.find(filter, { maxTimeMS: 5000 }).sort({ publishedOn: -1, _id: 1 }).skip((parsed.page - 1) * parsed.limit).limit(parsed.limit).toArray(), collection.countDocuments(filter, { maxTimeMS: 5000 }), collection.distinct("tags", { status: "published" }, { maxTimeMS: 5000 })]);
   return { items: await Promise.all(rows.map(toPublicPostView)), tags: tags.filter((tag): tag is string => typeof tag === "string" && !!tag).sort(), total, page: parsed.page, limit: parsed.limit };
 } catch { throw new DatabaseUnavailableError(); }
}
export const getPublicPost = cache(async (slug: string): Promise<PostView | null> => {
 if (!slugSchema.safeParse(slug).success) return null;
 try { const row = await (await getCollection("posts")).findOne({ slug, status: "published" }, { maxTimeMS: 5000 }); return row ? await toPublicPostView(row) : null; }
 catch { throw new DatabaseUnavailableError(); }
});
