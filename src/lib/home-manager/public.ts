import "server-only";
import type { Filter, Sort } from "mongodb";
import { getCollection } from "../db/collections";
import { parsePublicRecord, getPublishedMedia } from "../db/public-read";
import { DatabaseUnavailableError } from "../db/connection";
import { mediaSchema, type Models } from "../content/models";
import { toPublicProjectView } from "../projects/public";
import { toPublicCertificateView } from "../certificates/public";
import { toPublicPostView } from "../posts/public";
import type { SectionContent } from "../content/sections";
import type { SectionInput } from "./schema";
import type { ResolvedSection, ResolvedContent } from "./view-types";
type RelatedCollection = "projects" | "certificates" | "posts" | "skills" | "timelineEntries";
async function selected<K extends RelatedCollection>(name: K, config: SectionContent<"skills">, extra: object = {}): Promise<Models[K][]> {
 const filter = { ...extra, status: "published", ...(config.mode === "selected" ? { _id: { $in: config.ids } } : {}) } as Filter<Models[K]>;
 const order: Sort = name === "posts" ? { publishedOn: -1, _id: 1 } : { displayOrder: 1, _id: 1 };
 // Every model uses a string UUID _id; the driver loses this correlation for a generic collection.
 const rows = await (await getCollection(name)).find(filter, { maxTimeMS: 5000 }).sort(order).limit(config.mode === "selected" ? 24 : config.limit).toArray() as Models[K][];
 if (config.mode === "selected") return config.ids.flatMap((id) => rows.filter((row) => row._id === id)).slice(0, config.limit);
 return rows;
}
// Preview is called only by the admin-authorized route. Related records always
// remain published-only, even when previewing a draft section.
export async function resolveSection(input: SectionInput, id: string, previewMedia = false): Promise<ResolvedSection> {
 const section = input.section;
 async function image(mediaId: string, alt: string, caption?: string) {
  const asset = previewMedia ? await (await getCollection("media")).findOne({ _id: mediaId, kind: "image" }, { maxTimeMS: 5000 }) : await getPublishedMedia(mediaId);
  if (previewMedia && asset) mediaSchema.parse(asset);
  return asset?.kind === "image" ? { url: asset.url, alt, caption } : undefined;
 }
 let content: ResolvedContent;
 switch (section.type) {
 case "rich-text": content = { type: section.type, blocks: section.content.blocks }; break;
 case "image-and-text": content = { type: section.type, blocks: section.content.blocks, imageSide: section.content.imageSide, image: await image(section.content.mediaId, section.content.alt) }; break;
 case "gallery": {
  const images = await Promise.all(section.content.items.map((item) => image(item.mediaId, item.alt, item.caption)));
  content = { type: section.type, images: images.filter((item): item is NonNullable<typeof item> => !!item) }; break;
 }
 case "projects": content = { type: section.type, items: await Promise.all((await selected("projects", section.content, section.content.featuredOnly ? { featured: true } : {})).map(toPublicProjectView)) }; break;
 case "certificates": content = { type: section.type, items: await Promise.all((await selected("certificates", section.content)).map(toPublicCertificateView)) }; break;
 case "posts": content = { type: section.type, items: await Promise.all((await selected("posts", section.content)).map(toPublicPostView)) }; break;
 case "skills": content = { type: section.type, items: (await selected("skills", section.content)).map((row) => { const record = parsePublicRecord("skills", row); return { id: record.id, name: record.name, category: record.category, description: record.description }; }) }; break;
 case "timeline": content = { type: section.type, items: (await selected("timelineEntries", section.content, section.content.kind === "all" ? {} : { kind: section.content.kind })).map((row) => { const record = parsePublicRecord("timelineEntries", row); return { id: record.id, title: record.title, organization: record.organization, description: record.description, kind: record.kind, startMonth: record.startMonth, endMonth: record.endMonth, current: record.current }; }) }; break;
 case "cta": content = { type: section.type, ...section.content }; break;
 }
 return { id, title: input.title, subtitle: input.subtitle, content };
}
export async function getHomepageSections(): Promise<ResolvedSection[]> {
 try {
  const rows = await (await getCollection("homepageSections")).find({ status: "published" }, { maxTimeMS: 5000 }).sort({ displayOrder: 1, _id: 1 }).toArray();
  return await Promise.all(rows.map((row) => { const value = parsePublicRecord("homepageSections", row); return resolveSection({ title: value.title, subtitle: value.subtitle ?? "", status: "published", displayOrder: value.displayOrder, section: value.section }, value.id); }));
 } catch { throw new DatabaseUnavailableError(); }
}
