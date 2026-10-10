import "server-only";
import { sectionMediaIds } from "../home-manager/schema";
import { requireAdmin } from "../auth/admin";
import { uploads } from "./storage";
import { getCollection } from "../db/collections";
export type MediaItem = { id: string; name: string; kind: "image" | "document"; state: string; url?: string; alt: string };
export async function listAdminMedia(): Promise<MediaItem[]> {
  await requireAdmin();
  const records = await (await uploads()).find({ state: { $ne: "deleted" } }).sort({ createdAt: -1 }).limit(100).toArray();
  // Keep saved selections available even after they leave the newest 100.
  const [certificates, profiles, settings, projects, posts, sections] = await Promise.all([
    (await getCollection("certificates")).find({}, { projection: { mediaId: 1, pdfMediaId: 1 } }).toArray(),
    (await getCollection("profiles")).find({}, { projection: { photoMediaId: 1, cvMediaId: 1 } }).toArray(),
    (await getCollection("siteSettings")).find({}, { projection: { sharingMediaId: 1 } }).toArray(),
    (await getCollection("projects")).find({}, { projection: { mediaIds: 1, thumbnailId: 1, gallery: 1 } }).toArray(),
    (await getCollection("posts")).find({}, { projection: { coverMediaId: 1 } }).toArray(),
    (await getCollection("homepageSections")).find({}, { projection: { section: 1 } }).toArray(),
  ]);
  const referenced = [...sections.flatMap((item) => sectionMediaIds(item.section)), ...posts.map((item) => item.coverMediaId), ...projects.flatMap((item) => [...(item.mediaIds ?? []), item.thumbnailId, ...(item.gallery ?? []).map((image) => image.mediaId)]), ...certificates.flatMap((item) => [item.mediaId, item.pdfMediaId]), ...profiles.flatMap((item) => [item.photoMediaId, item.cvMediaId]), ...settings.map((item) => item.sharingMediaId)].filter((id): id is string => !!id && !records.some((record) => record._id === id));
  if (referenced.length) records.push(...await (await uploads()).find({ _id: { $in: referenced }, state: { $ne: "deleted" } }).toArray());
  const assets = await (await getCollection("media")).find({ _id: { $in: records.map((record) => record._id) } }).toArray();
  return records.map((record) => ({ id: record._id, name: record.input.name, kind: record.input.mime === "application/pdf" ? "document" : "image", state: record.state, url: assets.find((asset) => asset._id === record._id)?.url, alt: record.input.alt }));
}
