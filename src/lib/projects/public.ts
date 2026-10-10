import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { Filter } from "mongodb";
import type { Project } from "../content/models";
import { slugSchema } from "../content/models";
import { getCollection } from "../db/collections";
import { parsePublicRecord, getPublishedMedia } from "../db/public-read";
import { DatabaseUnavailableError } from "../db/connection";
import { projectCategories, type ProjectView } from "./schema";
export const projectQuerySchema = z.object({ q: z.string().trim().max(100).default(""), category: z.union([z.literal(""), z.enum(projectCategories)]).default(""), page: z.number().int().min(1).max(1000).default(1), limit: z.number().int().min(1).max(24).default(12), featured: z.boolean().default(false) });
export function projectFilter(options: z.input<typeof projectQuerySchema> = {}): Filter<Project> {
 const { q, category, featured } = projectQuerySchema.parse(options);
 const literal = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
 return { status: "published", ...(category ? { category } : {}), ...(featured ? { featured: true } : {}), ...(q ? { $or: [{ title: { $regex: literal, $options: "i" } }, { summary: { $regex: literal, $options: "i" } }, { technologies: { $regex: literal, $options: "i" } }] } : {}) };
}
export async function toPublicProjectView(row: Project): Promise<ProjectView> {
 const p = parsePublicRecord("projects", row);
 async function image(id: string | undefined, alt: string | undefined) {
   const asset = id ? await getPublishedMedia(id) : null;
   return asset?.kind === "image" ? { url: asset.url, alt: alt || asset.alt } : undefined;
 }
 const thumbnail = await image(p.thumbnailId, p.thumbnailAlt);
 const gallery = (await Promise.all(p.gallery.map((item) => image(item.mediaId, item.alt)))).filter((item): item is { url: string; alt: string } => !!item);
 return { id: p.id, slug: p.slug, title: p.title, summary: p.summary, description: p.description ?? p.body.map((block) => block.text).join("\n\n"), problem: p.problem, solution: p.solution, contribution: p.contribution, features: p.features, technologies: p.technologies, category: p.category, thumbnail, gallery, repositoryUrl: p.repositoryUrl, liveUrl: p.liveUrl, videoUrl: p.videoUrl, challenges: p.challenges, lessons: p.lessons };
}
export async function getPublicProjects(options: z.input<typeof projectQuerySchema> = {}) {
 const parsed = projectQuerySchema.parse(options);
 try {
   const collection = await getCollection("projects"); const filter = projectFilter(parsed);
   const [rows, total] = await Promise.all([collection.find(filter, { maxTimeMS: 5000 }).sort({ displayOrder: 1, _id: 1 }).skip((parsed.page - 1) * parsed.limit).limit(parsed.limit).toArray(), collection.countDocuments(filter, { maxTimeMS: 5000 })]);
   return { items: await Promise.all(rows.map(toPublicProjectView)), total, page: parsed.page, limit: parsed.limit };
 } catch { throw new DatabaseUnavailableError(); }
}
export const getPublicProject = cache(async (slug: string): Promise<ProjectView | null> => {
 if (!slugSchema.safeParse(slug).success) return null;
 try { const row = await (await getCollection("projects")).findOne({ slug, status: "published" }, { maxTimeMS: 5000 }); return row ? await toPublicProjectView(row) : null; }
 catch { throw new DatabaseUnavailableError(); }
});
