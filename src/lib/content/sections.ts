import { z } from "zod";

export const text = z.string().trim().min(1).max(500);
export const contentText = z.string().trim().min(1).max(100_000);
export const mediaId = z.uuid();
export const webUrl = z.url().refine((value) => {
  try { return ["https:", "http:"].includes(new URL(value).protocol); }
  catch { return false; }
}, "Use an HTTP or HTTPS URL");
export const sectionHref = z.string().max(2000).refine((value) => {
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}, "Use a safe HTTP(S) URL or a root-relative path");
const action = z.object({ label: text, href: sectionHref }).strict();
// Text is structured/plain text, never trusted HTML. Renderers must escape it.
const paragraph = z.object({ type: z.enum(["paragraph", "heading", "quote"]), text: contentText });
export const richText = z.array(paragraph).max(200);
const selection = z.object({ limit: z.number().int().min(1).max(24).default(6), mode: z.enum(["automatic", "selected"]).default("automatic"), ids: z.array(mediaId).max(24).refine((ids) => new Set(ids).size === ids.length, "Select each record only once").default([]) }).strict();

export const homepageSectionRegistry = {
  "rich-text": z.object({ blocks: richText }),
  "image-and-text": z.object({ mediaId, alt: text, blocks: richText, imageSide: z.enum(["left", "right"]).default("left") }),
  gallery: z.object({ items: z.array(z.object({ mediaId, alt: text, caption: text.optional() })).max(50) }),
  projects: selection.extend({ featuredOnly: z.boolean().default(false) }),
  certificates: selection,
  posts: selection,
  skills: selection,
  timeline: selection.extend({ kind: z.enum(["education", "experience", "all"]).default("all") }),
  cta: z.object({ body: contentText, action }),
} as const;

export type HomepageSectionType = keyof typeof homepageSectionRegistry;
export type SectionContent<K extends HomepageSectionType> = z.infer<(typeof homepageSectionRegistry)[K]>;

export const sectionContentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("rich-text"), content: homepageSectionRegistry["rich-text"] }),
  z.object({ type: z.literal("image-and-text"), content: homepageSectionRegistry["image-and-text"] }),
  z.object({ type: z.literal("gallery"), content: homepageSectionRegistry.gallery }),
  z.object({ type: z.literal("projects"), content: homepageSectionRegistry.projects }),
  z.object({ type: z.literal("certificates"), content: homepageSectionRegistry.certificates }),
  z.object({ type: z.literal("posts"), content: homepageSectionRegistry.posts }),
  z.object({ type: z.literal("skills"), content: homepageSectionRegistry.skills }),
  z.object({ type: z.literal("timeline"), content: homepageSectionRegistry.timeline }),
  z.object({ type: z.literal("cta"), content: homepageSectionRegistry.cta }),
]);
