import "server-only";
import { z } from "zod";
import { modelSchemas, slugSchema } from "../content/models";
import { getDatabase, DatabaseConfigurationError, DatabaseUnavailableError } from "./connection";

// Explicit allowlist: never add inbox data, provider keys, or admin settings.
const publicSchemas = {
  profiles: modelSchemas.profiles,
  siteSettings: modelSchemas.siteSettings,
  homepageSections: modelSchemas.homepageSections,
  projects: modelSchemas.projects,
  certificates: modelSchemas.certificates,
  posts: modelSchemas.posts,
  skills: modelSchemas.skills,
  timelineEntries: modelSchemas.timelineEntries,
  media: modelSchemas.media.omit({ providerKey: true, originalFilename: true }),
} as const;
export type PublicCollection = keyof typeof publicSchemas;
type PublicRecord<K extends PublicCollection> = Omit<z.infer<(typeof publicSchemas)[K]>, "_id" | "createdAt" | "updatedAt" | "status"> & { id: string; createdAt: string; updatedAt: string };
const pagination = z.object({ limit: z.number().int().min(1).max(100).default(24), offset: z.number().int().min(0).max(10_000).default(0) });

export class DatabaseContentError extends Error {
  constructor() { super("Published database content failed validation."); this.name = "DatabaseContentError"; }
}

// Schema parsing strips unknown fields. Status is checked again after querying
// to fail closed even if a database adapter unexpectedly returns a draft.
export function parsePublicRecord<K extends PublicCollection>(name: K, value: unknown): PublicRecord<K> {
  if (!Object.prototype.hasOwnProperty.call(publicSchemas, name)) throw new DatabaseContentError();
  const parsed = publicSchemas[name].safeParse(value);
  if (!parsed.success || parsed.data.status !== "published") throw new DatabaseContentError();
  const { _id, createdAt, updatedAt, status, ...fields } = parsed.data;
  void status;
  // The selected runtime schema determines K; TS cannot correlate an indexed
  // union with the generic return type after destructuring.
  return { ...fields, id: _id, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() } as unknown as PublicRecord<K>;
}

async function read<K extends PublicCollection>(name: K, options: { limit?: number; offset?: number }, match: { slug?: string; key?: string; _id?: string } = {}): Promise<PublicRecord<K>[]> {
  if (!Object.prototype.hasOwnProperty.call(publicSchemas, name)) throw new DatabaseContentError();
  const { limit, offset } = pagination.parse(options);
  try {
    const db = await getDatabase();
    const projection = Object.fromEntries(Object.keys(publicSchemas[name].shape).map((key) => [key, 1]));
    const records = await db.collection<{ _id: string }>(name).find({ ...match, status: "published" }, { projection, maxTimeMS: 5_000 }).sort({ displayOrder: 1, _id: 1 }).skip(offset).limit(limit).toArray();
    return records.map((record) => parsePublicRecord(name, record));
  } catch (error) {
    if (error instanceof DatabaseConfigurationError || error instanceof DatabaseContentError || error instanceof DatabaseUnavailableError) throw error;
    // Do not put raw driver messages (potentially containing credentials) in UI errors.
    throw new DatabaseUnavailableError();
  }
}

export function listPublished<K extends PublicCollection>(name: K, options: { limit?: number; offset?: number } = {}) {
  return read(name, options);
}
export async function getPublishedProject(slug: string) { return (await read("projects", { limit: 1 }, { slug: slugSchema.parse(slug) }))[0] ?? null; }
export async function getPublishedPost(slug: string) { return (await read("posts", { limit: 1 }, { slug: slugSchema.parse(slug) }))[0] ?? null; }
export async function getPublishedProfile() { return (await read("profiles", { limit: 1 }, { key: "owner" }))[0] ?? null; }
export async function getPublishedSiteSettings() { return (await read("siteSettings", { limit: 1 }, { key: "site" }))[0] ?? null; }
export async function getPublishedMedia(id: string) { return (await read("media", { limit: 1 }, { _id: z.uuid().parse(id) }))[0] ?? null; }
