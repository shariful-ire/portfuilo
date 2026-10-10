import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import type { MongoClient } from "mongodb";
import { postInputSchema, emptyPost, type PostInput } from "../src/lib/posts/schema";
import { createPost, updatePost, deletePost } from "../src/lib/posts/store";
import { getPublicPosts, getPublicPost, postQuerySchema } from "../src/lib/posts/public";
import { readingMinutes, safeMarkdownUrl } from "../src/lib/posts/markdown";
import { DatabaseUnavailableError } from "../src/lib/db/connection";
import { RequestError } from "../src/lib/admin/http";
const imageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const galleryId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const input: PostInput = { ...emptyPost, title: "Test fixture", slug: "test-fixture", excerpt: "Fixture only", markdown: "## Test heading\n\nFixture **body**.", coverMediaId: imageId, coverAlt: "Fixture cover", tags: ["C++"] };
type Row = Record<string, unknown>;
function media(id: string, kind: "image" | "document"): Row {
  return { _id: id, createdAt: new Date(), updatedAt: new Date(), status: "draft", displayOrder: 0, provider: "cloudinary", providerKey: `portfolio/${id}`, url: `https://res.cloudinary.com/test/image/upload/${id}`, kind, mimeType: kind === "image" ? "image/png" : "application/pdf", bytes: 10, alt: "Test fixture" };
}
async function fixture(run: (state: { tables: Record<string, Row[]>; ignorePublication: boolean }) => Promise<void>) {
  const state = { tables: { posts: [], media: [media(imageId, "image"), media(galleryId, "image")], mediaUploads: [{ _id: imageId, state: "ready" }, { _id: galleryId, state: "ready" }], contentLocks: [] } as Record<string, Row[]>, ignorePublication: false };
  const matches = (row: Row, filter: Row): boolean => Object.entries(filter).every(([key, value]) => {
    if (state.ignorePublication && key === "status") return true;
    if (key === "$or") return (value as Row[]).some((sub) => matches(row, sub));
    if (value && typeof value === "object" && "$regex" in value) { const pattern = value as { $regex: string; $options: string }; const regex = new RegExp(pattern.$regex, pattern.$options); return (Array.isArray(row[key]) ? row[key] as unknown[] : [row[key]]).some((entry) => regex.test(String(entry))); }
    return Array.isArray(row[key]) ? (row[key] as unknown[]).includes(value) : row[key] === value;
  });
  const session = { endSession: async () => undefined, withTransaction: async (fn: () => Promise<unknown>) => { const snapshot = structuredClone(state.tables); try { return await fn(); } catch (error) { state.tables = snapshot; throw error; } } };
  const client = { startSession: () => session, db: () => ({ collection: (name: string) => ({
    findOne: async (filter: Row) => state.tables[name].find((row) => matches(row, filter)) ?? null,
    find: (filter: Row) => {
      let rows = state.tables[name].filter((row) => matches(row, filter));
      const cursor = { sort: () => { rows = [...rows].sort((a, b) => String(b.publishedOn ?? "").localeCompare(String(a.publishedOn ?? "")) || String(a._id).localeCompare(String(b._id))); return cursor; }, skip: (n: number) => { rows = rows.slice(n); return cursor; }, limit: (n: number) => { rows = rows.slice(0, n); return cursor; }, toArray: async () => structuredClone(rows) };
      return cursor;
    },
    countDocuments: async (filter: Row) => state.tables[name].filter((row) => matches(row, filter)).length,
    distinct: async (field: string, filter: Row) => [...new Set(state.tables[name].filter((row) => matches(row, filter)).flatMap((row) => row[field] as string[]))],
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
test("post validation bounds content and rejects invalid dates, slugs and forged identity", () => {
 for (const change of [{ slug: "Bad slug" }, { coverAlt: " " }, { publishedOn: "2025-02-30" }, { status: "published", publishedOn: "9999-01-01" }, { markdown: "x".repeat(100001) }, { ADMIN_EMAIL: "fake@example.com" }]) assert.equal(postInputSchema.safeParse({ ...input, ...change }).success, false);
 assert.deepEqual(postInputSchema.parse({ ...input, tags: ["C++", "C++"] }).tags, ["C++"]);
});
test("draft direct URL and tags stay private; publication sets date and resolves cover; unpublish removes access", async () => fixture(async (state) => {
 const draft = await createPost(input);
 assert.equal(await getPublicPost(input.slug), null); assert.equal((await getPublicPosts()).total, 0); assert.deepEqual((await getPublicPosts()).tags, []);
 assert.equal(state.tables.media[0].status, "draft");
 const published = await updatePost(draft.id, { status: "published" }, draft.updatedAt);
 const visible = await getPublicPost(input.slug);
 assert.ok(visible?.cover?.url); assert.equal(visible?.cover?.alt, input.coverAlt);
 assert.equal(visible?.publishedOn, new Date().toISOString().slice(0, 10)); assert.equal(visible?.readingMinutes, 1);
 assert.deepEqual((await getPublicPosts()).tags, ["C++"]);
 await updatePost(draft.id, { status: "draft" }, published.updatedAt);
 assert.equal(await getPublicPost(input.slug), null); assert.deepEqual((await getPublicPosts()).tags, []);
}));
test("unique slugs include drafts and conflicts roll back edits", async () => fixture(async (state) => {
 await createPost(input); await assert.rejects(createPost(input), (e: unknown) => e instanceof RequestError && e.status === 409);
 const other = await createPost({ ...input, slug: "other" }); await assert.rejects(updatePost(other.id, input, other.updatedAt), RequestError);
 assert.equal(state.tables.posts[1].slug, "other");
}));
test("edits persist Markdown/SEO/date/cover, preserve identity, clear optional SEO, and reject stale writes", async () => fixture(async (state) => {
 const first = await createPost({ ...input, seoTitle: "Old SEO", status: "published", publishedOn: "2025-01-02" });
 const created = state.tables.posts[0].createdAt;
 const updated = await updatePost(first.id, { ...input, slug: "renamed", markdown: "Updated body", coverMediaId: galleryId, status: "published", publishedOn: "2025-01-02", seoDescription: "Saved description" }, first.updatedAt);
 assert.deepEqual(state.tables.posts[0].createdAt, created); assert.equal(updated.id, first.id); assert.equal(state.tables.posts[0].seoTitle, undefined);
 assert.equal(await getPublicPost(input.slug), null); const visible = await getPublicPost("renamed"); assert.equal(visible?.markdown, "Updated body"); assert.equal(visible?.seoDescription, "Saved description"); assert.equal(visible?.publishedOn, "2025-01-02");
 await assert.rejects(updatePost(first.id, input, first.updatedAt), RequestError); await assert.rejects(deletePost(first.id, first.updatedAt), RequestError);
 await deletePost(first.id, updated.updatedAt); assert.equal(state.tables.posts.length, 0); assert.equal(state.tables.media.length, 2);
}));
test("wrong or deleting covers abort saves; unpublish remains possible with unavailable media", async () => fixture(async (state) => {
 state.tables.media[0].kind = "document";
 await assert.rejects(createPost({ ...input, status: "published" }), RequestError); assert.equal(state.tables.posts.length, 0); assert.equal(state.tables.media[0].status, "draft");
 state.tables.media[0].kind = "image"; const saved = await createPost({ ...input, status: "published" }); state.tables.mediaUploads[0].state = "deleting";
 await assert.rejects(createPost({ ...input, slug: "other" }), RequestError);
 await updatePost(saved.id, { status: "draft" }, saved.updatedAt); assert.equal(await getPublicPost(input.slug), null);
}));
test("newest publication dates, literal search, tag filter and pagination exclude drafts", async () => fixture(async () => {
 await createPost({ ...input, slug: "private", tags: ["Private"] });
 await createPost({ ...input, slug: "older", status: "published", publishedOn: "2025-01-01" });
 await createPost({ ...input, slug: "newer", status: "published", publishedOn: "2025-02-01" });
 await createPost({ ...input, slug: "other", tags: ["Other"], status: "published", publishedOn: "2025-03-01" });
 const result = await getPublicPosts({ q: "C++", tag: "C++", limit: 1, page: 2 }); assert.equal(result.total, 2); assert.equal(result.items[0].slug, "older");
 assert.equal((await getPublicPosts({ limit: 1 })).items[0].slug, "other"); assert.deepEqual(result.tags, ["C++", "Other"]);
 assert.equal((await getPublicPosts({ q: ".*" })).total, 0); assert.equal(postQuerySchema.safeParse({ q: "x".repeat(101) }).success, false);
}));
test("future dates may be drafted but cannot be published; republish preserves a saved date", async () => fixture(async () => {
 const draft = await createPost({ ...input, publishedOn: "9999-01-01" }); await assert.rejects(updatePost(draft.id, { status: "published" }, draft.updatedAt));
 const published = await updatePost(draft.id, { ...input, publishedOn: "2025-01-01", status: "published" }, draft.updatedAt);
 const hidden = await updatePost(draft.id, { status: "draft" }, published.updatedAt);
 await updatePost(draft.id, { status: "published" }, hidden.updatedAt); assert.equal((await getPublicPost(input.slug))?.publishedOn, "2025-01-01");
}));
test("unexpected draft query results fail closed for list and direct reader", async () => fixture(async (state) => {
 await createPost(input); state.ignorePublication = true; await assert.rejects(getPublicPosts(), DatabaseUnavailableError); await assert.rejects(getPublicPost(input.slug), DatabaseUnavailableError);
}));
test("reading estimate and Markdown URL policy reject executable and deceptive destinations", () => {
 assert.equal(readingMinutes("word ".repeat(401)), 3); assert.equal(readingMinutes(""), 1);
 for (const url of ["javascript:alert(1)", "data:text/html,evil", "vbscript:evil", "//evil.example", "/\\evil.example", "https://user:secret@example.com", "java\nscript:evil"]) assert.equal(safeMarkdownUrl(url), "");
 for (const url of ["https://example.com", "/posts", "#heading"]) assert.equal(safeMarkdownUrl(url), url);
});
test("actual preview/article renderer strips unsafe HTML and URLs and displays fenced code inertly", () => {
 const bodies = ["## Heading\n\n**Bold** and [safe](https://example.com).", "<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<iframe src='https://evil.example'></iframe>", "[bad](javascript:alert%281%29) [encoded](jav&#x61;script:alert%281%29) ![image](https://evil.example/a.svg)", "```html\n<script>alert(1)</script>\n```", "<svg onload=alert(1)></svg>\n\n<form action='https://evil.example'><input autofocus></form>"];
 const rendered = spawnSync(process.execPath, ["--import", "tsx", "tests/fixtures/render-markdown.ts"], { input: JSON.stringify(bodies), encoding: "utf8", timeout: 30000 });
 assert.equal(rendered.status, 0, rendered.stderr);
 const html: string[] = JSON.parse(rendered.stdout);
 assert.match(html[0], /<h2>Heading<\/h2>/); assert.match(html[0], /<strong>Bold<\/strong>/); assert.match(html[0], /href="https:\/\/example.com"/);
 for (const output of html) assert.doesNotMatch(output, /<script|<iframe|<img|<svg|<form|<input|onerror=|onload=|href="javascript:/i);
 assert.match(html[3], /&lt;script&gt;/); assert.match(html[3], /<pre>/);
});
