import { z } from "zod";
import { slugSchema } from "../content/models";
import { webUrl } from "../content/sections";
export const projectCategories = ["Web", "IoT", "Robotics", "Other"] as const;
const short = z.string().trim().min(1).max(200);
const prose = z.string().trim().min(1).max(5000);
const link = z.union([z.literal(""), webUrl.max(2000).refine((value) => { try { const url = new URL(value); return !url.username && !url.password; } catch { return false; } }, "URL must not contain credentials")]);
export const projectInputSchema = z.object({
 title: short, slug: slugSchema, summary: z.string().trim().min(1).max(500), description: prose,
 problem: prose, solution: prose, contribution: prose,
 features: z.array(short).max(30), technologies: z.array(short).max(50),
 thumbnailId: z.uuid(), thumbnailAlt: z.string().trim().min(1).max(500),
 gallery: z.array(z.object({ mediaId: z.uuid(), alt: z.string().trim().min(1).max(500) }).strict()).max(20),
 category: z.enum(projectCategories), repositoryUrl: link, liveUrl: link, videoUrl: link,
 challenges: z.string().trim().max(5000), lessons: z.string().trim().max(5000),
 featured: z.boolean(), displayOrder: z.number().int().min(0).max(1_000_000), status: z.enum(["draft", "published"]),
}).strict().refine((data) => new Set(data.gallery.map((item) => item.mediaId)).size === data.gallery.length, "Gallery images must be unique");
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type AdminProject = { id: string; updatedAt: string; data: ProjectInput };
export const emptyProject: ProjectInput = { title: "", slug: "", summary: "", description: "", problem: "", solution: "", contribution: "", features: [], technologies: [], thumbnailId: "", thumbnailAlt: "", gallery: [], category: "Web", repositoryUrl: "", liveUrl: "", videoUrl: "", challenges: "", lessons: "", featured: false, displayOrder: 0, status: "draft" };
export const projectUpdateSchema = z.object({ data: projectInputSchema, expectedUpdatedAt: z.iso.datetime() }).strict();
export const projectActionSchema = z.object({ status: z.enum(["draft", "published"]), expectedUpdatedAt: z.iso.datetime() }).strict();
export const projectDeleteSchema = z.object({ expectedUpdatedAt: z.iso.datetime() }).strict();
export type ProjectView = { id: string; slug: string; title: string; summary: string; description: string; problem?: string; solution?: string; contribution?: string; features: string[]; technologies: string[]; category: string; thumbnail?: { url: string; alt: string }; gallery: { url: string; alt: string }[]; repositoryUrl?: string; liveUrl?: string; videoUrl?: string; challenges?: string; lessons?: string };
