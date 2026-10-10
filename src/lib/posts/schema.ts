import { z } from "zod";
import { slugSchema } from "../content/models";
export const postInputSchema = z.object({
 title: z.string().trim().min(1).max(200), slug: slugSchema,
 coverMediaId: z.uuid(), coverAlt: z.string().trim().min(1).max(500),
 excerpt: z.string().trim().min(1).max(500), markdown: z.string().trim().min(1).max(100_000),
 tags: z.array(z.string().trim().min(1).max(50)).max(30).transform((tags) => [...new Set(tags)]),
 status: z.enum(["draft", "published"]), publishedOn: z.union([z.literal(""), z.iso.date()]),
 seoTitle: z.string().trim().max(200), seoDescription: z.string().trim().max(500),
}).strict().refine((data) => data.status !== "published" || !data.publishedOn || data.publishedOn <= new Date().toISOString().slice(0, 10), { path: ["publishedOn"], message: "Publication date cannot be in the future. Keep the post as a draft until ready." });
export type PostInput = z.infer<typeof postInputSchema>;
export type AdminPost = { id: string; updatedAt: string; data: PostInput };
export const emptyPost: PostInput = { title: "", slug: "", coverMediaId: "", coverAlt: "", excerpt: "", markdown: "", tags: [], status: "draft", publishedOn: "", seoTitle: "", seoDescription: "" };
export const postUpdateSchema = z.object({ data: postInputSchema, expectedUpdatedAt: z.iso.datetime() }).strict();
export const postActionSchema = z.object({ status: z.enum(["draft", "published"]), expectedUpdatedAt: z.iso.datetime() }).strict();
export const postDeleteSchema = z.object({ expectedUpdatedAt: z.iso.datetime() }).strict();
export type PostView = { id: string; slug: string; title: string; excerpt: string; markdown: string; tags: string[]; publishedOn?: string; updatedAt: string; seoTitle?: string; seoDescription?: string; cover?: { url: string; alt: string }; readingMinutes: number };
