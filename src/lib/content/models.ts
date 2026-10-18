import { customContactLinksSchema } from "../contact/custom-links";
import { ideaRecordSchema } from "../ideas/schema";
import { presentationSchema } from "../settings/presentation";
import { z } from "zod";
import { contentText, mediaId, richText, sectionContentSchema, text, webUrl } from "./sections";

export const slugSchema = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const timestamps = z.object({ _id: z.uuid(), createdAt: z.date(), updatedAt: z.date() });
const publication = timestamps.extend({ status: z.enum(["draft", "published"]).default("draft"), displayOrder: z.number().int().min(0).default(0) });
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const profileSchema = publication.extend({
  customContacts: customContactLinksSchema.default([]),
  key: z.literal("owner"), name: text, shortName: text, introduction: contentText,
  university: text.optional(), degree: text.optional(), country: text.optional(), city: text.optional(),
  publicEmail: z.email().optional(), github: webUrl.optional(), linkedin: webUrl.optional(),
  whatsapp: text.optional(), telegram: text.optional(), photoMediaId: mediaId.optional(), cvMediaId: mediaId.optional(),
  webFocusTitle: z.string().max(120).optional(), webFocusDescription: z.string().max(1000).optional(),
  hardwareFocusTitle: z.string().max(120).optional(), hardwareFocusDescription: z.string().max(1000).optional(),
  headline: text.optional(), biography: contentText.optional(), department: text.optional(), availability: text.optional(),
});
export const siteSettingsSchema = publication.extend({ key: z.literal("site"), presentation: presentationSchema.optional(), title: text, description: contentText, heroText: text, sharingMediaId: mediaId.optional() });
export const homepageSectionSchema = publication.extend({ title: text, subtitle: z.string().trim().max(500).optional(), section: sectionContentSchema });
export const projectSchema = publication.extend({ title: text, slug: slugSchema, summary: text, body: richText, technologies: z.array(text).max(50), mediaIds: z.array(mediaId).max(50).default([]), repositoryUrl: webUrl.optional(), liveUrl: webUrl.optional(), description: contentText.optional(), problem: contentText.optional(), solution: contentText.optional(), contribution: contentText.optional(), features: z.array(text).max(30).default([]), thumbnailId: mediaId.optional(), thumbnailAlt: text.optional(), gallery: z.array(z.object({ mediaId, alt: text })).max(20).default([]), category: z.enum(["Web", "IoT", "Robotics", "Other"]).default("Other"), videoUrl: webUrl.optional(), challenges: contentText.optional(), lessons: contentText.optional(), featured: z.boolean().default(false) });
export const certificateSchema = publication.extend({ title: text, issuer: text, issuedOn: z.union([month, z.iso.date()]).optional(), credentialUrl: webUrl.optional(), mediaId: mediaId.optional(), imageAlt: text.optional(), pdfMediaId: mediaId.optional(), credentialId: text.optional(), description: contentText.optional(), category: text.optional() });
export const postSchema = publication.extend({ title: text, slug: slugSchema, excerpt: text, body: richText, tags: z.array(text).max(30).default([]), coverMediaId: mediaId.optional(), coverAlt: text.optional(), markdown: contentText.optional(), publishedOn: z.iso.date().optional(), seoTitle: text.optional(), seoDescription: text.optional() });
export const skillSchema = publication.extend({ name: text, category: text.optional(), description: text.optional() });
export const timelineEntrySchema = publication.extend({ kind: z.enum(["education", "experience"]), title: text, organization: text, description: contentText.optional(), startMonth: month.optional(), endMonth: month.optional(), current: z.boolean().default(false) }).refine((entry) => !(entry.current && entry.endMonth) && !(entry.startMonth && entry.endMonth && entry.endMonth < entry.startMonth), "Invalid timeline date range");
export const mediaSchema = publication.extend({ provider: z.literal("cloudinary"), providerKey: text, url: webUrl, kind: z.enum(["image", "video", "document"]), mimeType: text, bytes: z.number().int().nonnegative(), width: z.number().int().positive().optional(), height: z.number().int().positive().optional(), alt: z.string().max(500), originalFilename: text.optional() });
export const contactMessageSchema = timestamps.extend({ name: text, email: z.email(), subject: text, message: z.string().trim().min(1).max(10_000), state: z.enum(["unread", "read", "archived"]).default("unread") });

export const modelSchemas = { ideaSubmissions: ideaRecordSchema, profiles: profileSchema, siteSettings: siteSettingsSchema, homepageSections: homepageSectionSchema, projects: projectSchema, certificates: certificateSchema, posts: postSchema, skills: skillSchema, timelineEntries: timelineEntrySchema, media: mediaSchema, contactMessages: contactMessageSchema } as const;
export type Models = { [K in keyof typeof modelSchemas]: z.infer<(typeof modelSchemas)[K]> };
export type CollectionName = keyof Models;
export type Profile = Models["profiles"];
export type SiteSettings = Models["siteSettings"];
export type HomepageSection = Models["homepageSections"];
export type Project = Models["projects"];
export type Certificate = Models["certificates"];
export type Post = Models["posts"];
export type Skill = Models["skills"];
export type TimelineEntry = Models["timelineEntries"];
export type Media = Models["media"];
export type ContactMessage = Models["contactMessages"];
