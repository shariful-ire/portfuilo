import assert from "node:assert/strict";
import { test } from "node:test";
import type { MongoClient } from "mongodb";
import { projectInputSchema, emptyProject, type ProjectInput } from "../src/lib/projects/schema";
import { createProject, updateProject, deleteProject } from "../src/lib/projects/store";
import { getPublicProjects, getPublicProject, projectFilter, projectQuerySchema } from "../src/lib/projects/public";
import { DatabaseUnavailableError } from "../src/lib/db/connection";
import { RequestError } from "../src/lib/admin/http";
const imageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const galleryId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const input: ProjectInput = { ...emptyProject, title: "Test fixture", slug: "test-fixture", summary: "Fixture only", description: "Description fixture", problem: "Problem fixture", solution: "Solution fixture", contribution: "Contribution fixture", thumbnailId: imageId, thumbnailAlt: "Fixture thumbnail", gallery: [{ mediaId: galleryId, alt: "Fixture gallery" }], technologies: ["C++"], features: ["Test feature"] };
type Row = Record<string, unknown>;
function media(id: string, kind: "image" | "document"): Row {
  return { _id: id, createdAt: new Date(), updatedAt: new Date(), status: "draft", displayOrder: 0, provider: "cloudinary", providerKey: `portfolio/${id}`, url: `https://res.cloudinary.com/test/image/upload/${id}`, kind, mimeType: kind === "image" ? "image/png" : "application/pdf", bytes: 10, alt: "Test fixture" };
}
async function fixture(run: (state: { tables: Record<string, Row[]>; ignorePublication: boolean }) => Promise<void>) {
  const state = { tables: { projects: [], media: [media(imageId, "image"), media(galleryId, "image")], mediaUploads: [{ _id: imageId, state: "ready" }, { _id: galleryId, state: "ready" }], contentLocks: [] } as Record<string, Row[]>, ignorePublication: false };
  const matches = (row: Row, filter: Row): boolean => Object.entries(filter).every(([key, value]) => {
    if (state.ignorePublication && key === "status") return true;
    if (key === "$or") return (value as Row[]).some((sub) => matches(row, sub));
    if (value && typeof value === "object" && "$regex" in value) { const pattern = value as { $regex: string; $options: string }; const regex = new RegExp(pattern.$regex, pattern.$options); return (Array.isArray(row[key]) ? row[key] as unknown[] : [row[key]]).some((entry) => regex.test(String(entry))); }
    return row[key] === value;
  });
  const session = { endSession: async () => undefined, withTransaction: async (fn: () => Promise<unknown>) => { const snapshot = structuredClone(state.tables); try { return await fn(); } catch (error) { state.tables = snapshot; throw error; } } };
  const client = { startSession: () => session, db: () => ({ collection: (name: string) => ({
    findOne: async (filter: Row) => state.tables[name].find((row) => matches(row, filter)) ?? null,
    find: (filter: Row) => {
      let rows = state.tables[name].filter((row) => matches(row, filter));
      const cursor = { sort: () => { rows = [...rows].sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder) || String(a._id).localeCompare(String(b._id))); return cursor; }, skip: (n: number) => { rows = rows.slice(n); return cursor; }, limit: (n: number) => { rows = rows.slice(0, n); return cursor; }, toArray: async () => structuredClone(rows) };
      return cursor;
    },
    countDocuments: async (filter: Row) => state.tables[name].filter((row) => matches(row, filter)).length,
    distinct: async (field: string, filter: Row) => [...new Set(state.tables[name].filter((row) => matches(row, filter)).map((row) => row[field]))],
    insertOne: async (row: Row) => { state.tables[name].push(structuredClone(row)); },
    replaceOne: async (filter: Row, row: Row) => { const index = state.tables[name].findIndex((entry) => matches(entry, filter)); assert.ok(index >= 0); state.tables[name][index] = structuredClone(row); },
    deleteOne: async (filter: Row) => { state.tables[name] = state.tables[name].filter((row) => !matches(row, filter)); },
    updateOne: async (filter: Row, update: { $set?: Row; $inc?: Record<string, number> }, options?: { upsert?: boolean }) => {
      let row = state.tables[name].find((entry) => matches(entry, filter));
      if (!row && options?.upsert) { row = { ...filter }; state.tables[name].push(row); }
      if (!row) return { matchedCount: 0 };
      Object.assign(row, update.$set);
      for (const [key, amount] of Object.entries(update.$inc ?? {})) row[key] = Number(row[key] ?? 0) + amount;
      return { matchedCount: 1 };
    },
  }) }) };
  const globalDb = globalThis as typeof globalThis & { portfolioMongo?: Promise<MongoClient> };
  const oldClient = globalDb.portfolioMongo;
  const oldUri = process.env.MONGODB_URI;
  const oldName = process.env.MONGODB_DB_NAME;
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017"; process.env.MONGODB_DB_NAME = "unit_test_only";
  globalDb.portfolioMongo = Promise.resolve(client as unknown as MongoClient);
  try { await run(state); } finally { globalDb.portfolioMongo = oldClient; if (oldUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = oldUri; if (oldName === undefined) delete process.env.MONGODB_DB_NAME; else process.env.MONGODB_DB_NAME = oldName; }
}
test("project validation rejects unsafe URLs, invalid slugs, duplicate gallery, unknown category and identity fields", () => {
 for (const change of [{ slug: "Bad slug" }, { slug: "../private" }, { repositoryUrl: "javascript:alert(1)" }, { videoUrl: "https://user:secret@example.com" }, { thumbnailAlt: " " }, { gallery: [input.gallery[0], input.gallery[0]] }, { category: "Fake" }, { displayOrder: -1 }, { ADMIN_EMAIL: "spoof@example.com" }]) assert.equal(projectInputSchema.safeParse({ ...input, ...change }).success, false);
 assert.equal(projectInputSchema.parse(input).status, "draft");
});
test("draft direct URL stays hidden, publish resolves media, unpublish hides direct and listing access", async () => fixture(async (state) => {
 const draft = await createProject(input);
 assert.equal(await getPublicProject(input.slug), null);
 assert.equal((await getPublicProjects()).total, 0);
 const published = await updateProject(draft.id, { status: "published" }, draft.updatedAt);
 const visible = await getPublicProject(input.slug);
 assert.equal(visible?.thumbnail?.alt, input.thumbnailAlt);
 assert.equal(visible?.gallery[0].alt, input.gallery[0].alt);
 assert.ok(visible?.thumbnail?.url);
 assert.ok(!("providerKey" in visible!));
 assert.equal(state.tables.media[1].status, "published");
 await updateProject(draft.id, { status: "draft" }, published.updatedAt);
 assert.equal(await getPublicProject(input.slug), null);
 assert.equal((await getPublicProjects()).total, 0);
}));
test("slug conflicts include drafts and reject both create and update without altering records", async () => fixture(async (state) => {
 await createProject(input);
 await assert.rejects(createProject(input), (error: unknown) => error instanceof RequestError && error.status === 409);
 const second = await createProject({ ...input, slug: "second" });
 await assert.rejects(updateProject(second.id, input, second.updatedAt), (error: unknown) => error instanceof RequestError && error.status === 409);
 assert.equal(state.tables.projects.length, 2);
 assert.equal(state.tables.projects[1].slug, "second");
}));
test("edits preserve identity, replace media references, clear links, change slug, and reject stale saves/deletes", async () => fixture(async (state) => {
 const first = await createProject({ ...input, repositoryUrl: "https://example.com/fixture", status: "published" });
 const createdAt = state.tables.projects[0].createdAt;
 const updated = await updateProject(first.id, { ...input, slug: "renamed", thumbnailId: galleryId, gallery: [], status: "published", displayOrder: 8 }, first.updatedAt);
 assert.equal(updated.id, first.id);
 assert.deepEqual(state.tables.projects[0].createdAt, createdAt);
 assert.deepEqual(state.tables.projects[0].mediaIds, [galleryId]);
 assert.equal(state.tables.projects[0].repositoryUrl, undefined);
 assert.equal(await getPublicProject(input.slug), null);
 assert.equal((await getPublicProject("renamed"))?.id, first.id);
 await assert.rejects(updateProject(first.id, input, first.updatedAt), RequestError);
 await assert.rejects(deleteProject(first.id, first.updatedAt), RequestError);
 await deleteProject(first.id, updated.updatedAt);
 assert.equal(state.tables.projects.length, 0);
 assert.equal(state.tables.media.length, 2);
}));
test("wrong gallery kind rolls back project and thumbnail publication", async () => fixture(async (state) => {
 state.tables.media[1].kind = "document";
 await assert.rejects(createProject({ ...input, status: "published" }), RequestError);
 assert.equal(state.tables.projects.length, 0);
 assert.equal(state.tables.media[0].status, "draft");
}));
test("deleting image cannot be attached; existing publication can still be revoked", async () => fixture(async (state) => {
 const saved = await createProject({ ...input, status: "published" });
 state.tables.mediaUploads[0].state = "deleting";
 await assert.rejects(createProject({ ...input, slug: "another" }), RequestError);
 await updateProject(saved.id, { status: "draft" }, saved.updatedAt);
 assert.equal(await getPublicProject(input.slug), null);
}));
test("search is literal, category/featured filters and pagination always exclude drafts", async () => fixture(async () => {
 await createProject({ ...input, slug: "secret", featured: true });
 await createProject({ ...input, slug: "public-a", status: "published", featured: true, displayOrder: 1 });
 await createProject({ ...input, slug: "public-b", status: "published", displayOrder: 2 });
 await createProject({ ...input, slug: "robot", category: "Robotics", technologies: [], status: "published" });
 const found = await getPublicProjects({ q: "C++", category: "Web", page: 2, limit: 1 });
 assert.equal(found.total, 2); assert.equal(found.items[0].slug, "public-b");
 assert.equal((await getPublicProjects({ featured: true })).items[0].slug, "public-a");
 assert.equal((await getPublicProjects({ featured: true })).total, 1);
 assert.equal((await getPublicProjects({ q: ".*" })).total, 0);
 assert.equal(projectQuerySchema.safeParse({ q: "x".repeat(101) }).success, false);
 assert.equal(projectQuerySchema.safeParse({ page: 0 }).success, false);
 assert.equal(projectFilter({ q: "[test]" }).status, "published");
}));
test("public list and direct reader fail closed even if a database adapter returns a draft", async () => fixture(async (state) => {
 await createProject(input); state.ignorePublication = true;
 await assert.rejects(getPublicProjects(), DatabaseUnavailableError);
 await assert.rejects(getPublicProject(input.slug), DatabaseUnavailableError);
}));
test("invalid direct slugs return not found without database access", async () => {
 assert.equal(await getPublicProject("../draft"), null);
});
