import { z } from "zod";
import { sectionContentSchema, type HomepageSectionType } from "../content/sections";
export const managedKindSchema = z.enum(["sections", "skills", "timeline"]);
export type ManagedKind = z.infer<typeof managedKindSchema>;
export const managedCollections = { sections: "homepageSections", skills: "skills", timeline: "timelineEntries" } as const;
const base = { status: z.enum(["draft", "published"]), displayOrder: z.number().int().min(0).max(1_000_000) };
const title = z.string().trim().min(1).max(200);
export const sectionInputSchema = z.object({ ...base, title, subtitle: z.string().trim().max(500), section: sectionContentSchema }).strict();
export const skillInputSchema = z.object({ ...base, name: title, category: z.string().trim().max(200), description: z.string().trim().max(500) }).strict();
const month = z.union([z.literal(""), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)]);
export const timelineInputSchema = z.object({ ...base, kind: z.enum(["education", "experience"]), title, organization: title, description: z.string().trim().max(10000), startMonth: month, endMonth: month, current: z.boolean() }).strict().refine((data) => !(data.current && data.endMonth) && !(data.startMonth && data.endMonth && data.endMonth < data.startMonth), "Invalid date range: current entries cannot have an end date");
export const managedInputSchema = z.discriminatedUnion("kind", [z.object({ kind: z.literal("sections"), data: sectionInputSchema }).strict(), z.object({ kind: z.literal("skills"), data: skillInputSchema }).strict(), z.object({ kind: z.literal("timeline"), data: timelineInputSchema }).strict()]);
export type ManagedInput = z.infer<typeof managedInputSchema>;
export type SectionInput = z.infer<typeof sectionInputSchema>;
export type AdminManaged = { id: string; updatedAt: string; input: ManagedInput };
export const expectedSchema = z.object({ expectedUpdatedAt: z.iso.datetime() }).strict();
export const statusSchema = expectedSchema.extend({ status: z.enum(["draft", "published"]) });
export const moveSchema = z.object({ id: z.uuid(), direction: z.enum(["up", "down"]), expectedUpdatedAt: z.iso.datetime() }).strict();
export const updateSchema = expectedSchema.extend({ data: z.unknown() });
export function emptySection(type: HomepageSectionType): SectionInput["section"] {
 switch (type) {
 case "rich-text": return { type, content: { blocks: [] } };
 case "image-and-text": return { type, content: { mediaId: "", alt: "", blocks: [], imageSide: "left" } };
 case "gallery": return { type, content: { items: [] } };
 case "cta": return { type, content: { body: "", action: { label: "", href: "" } } };
 case "timeline": return { type, content: { mode: "automatic", ids: [], limit: 6, kind: "all" } };
 case "projects": return { type, content: { mode: "automatic", ids: [], limit: 6, featuredOnly: false } };
 default: return { type, content: { mode: "automatic", ids: [], limit: 6 } };
 }
}
export function emptyManaged(kind: ManagedKind): ManagedInput {
 const base = { status: "draft" as const, displayOrder: 0 };
 if (kind === "sections") return { kind, data: { ...base, title: "", subtitle: "", section: emptySection("rich-text") } };
 if (kind === "skills") return { kind, data: { ...base, name: "", category: "", description: "" } };
 return { kind, data: { ...base, kind: "education", title: "", organization: "", description: "", startMonth: "", endMonth: "", current: false } };
}
export function sectionMediaIds(section: SectionInput["section"]): string[] {
 return section.type === "image-and-text" ? [section.content.mediaId] : section.type === "gallery" ? [...new Set(section.content.items.map((item) => item.mediaId))] : [];
}
export type RelatedOption = { id: string; label: string; status: "draft" | "published" };
export type RelatedOptions = Record<"projects" | "certificates" | "posts" | "skills" | "timeline", RelatedOption[]>;
