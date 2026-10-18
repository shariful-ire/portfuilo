import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import type { MongoClient } from "mongodb";
import { prepareCreate } from "../src/lib/db/records";
import { createManaged, updateManaged, setManagedStatus, deleteManaged, moveManaged } from "../src/lib/home-manager/store";
import { managedInputSchema, sectionInputSchema, emptySection, type ManagedInput, type SectionInput } from "../src/lib/home-manager/schema";
import { homepageSectionRegistry, sectionHref } from "../src/lib/content/sections";
import { getHomepageSections, resolveSection } from "../src/lib/home-manager/public";
import { DatabaseUnavailableError } from "../src/lib/db/connection";
import { RequestError } from "../src/lib/admin/http";
const imageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const galleryId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const section: SectionInput = { title: "Fixture section", subtitle: "Fixture subtitle", displayOrder: 0, status: "draft", section: { type: "rich-text", content: { blocks: [{ type: "paragraph", text: "Fixture only" }] } } };
const skill: ManagedInput = { kind: "skills", data: { name: "Fixture skill", category: "Fixture", description: "Fixture description", status: "draft", displayOrder: 0 } };
const timeline: ManagedInput = { kind: "timeline", data: { kind: "education", title: "Fixture study", organization: "Fixture organization", description: "", startMonth: "2024-01", endMonth: "", current: true, status: "draft", displayOrder: 0 } };
type Row = Record<string, unknown>;
function media(id: string, kind: "image" | "document"): Row {
  return { _id: id, createdAt: new Date(), updatedAt: new Date(), status: "draft", displayOrder: 0, provider: "cloudinary", providerKey: `portfolio/${id}`, url: `https://res.cloudinary.com/test/image/upload/${id}`, kind, mimeType: kind === "image" ? "image/png" : "application/pdf", bytes: 10, alt: "Test fixture" };
}
async function fixture(run: (state: { tables: Record<string, Row[]>; ignorePublication: boolean }) => Promise<void>) {
  const state = { tables: { homepageSections: [], skills: [], timelineEntries: [], projects: [], certificates: [], posts: [], media: [media(imageId, "image"), media(galleryId, "image")], mediaUploads: [{ _id: imageId, state: "ready" }, { _id: galleryId, state: "ready" }], contentLocks: [] } as Record<string, Row[]>, ignorePublication: false };
  const matches = (row: Row, filter: Row): boolean => Object.entries(filter).every(([key, value]) => {
    if (state.ignorePublication && key === "status") return true;
    if (key === "$or") return (value as Row[]).some((sub) => matches(row, sub));
    if (value && typeof value === "object" && "$regex" in value) { const pattern = value as { $regex: string; $options: string }; const regex = new RegExp(pattern.$regex, pattern.$options); return (Array.isArray(row[key]) ? row[key] as unknown[] : [row[key]]).some((entry) => regex.test(String(entry))); }
    if (value && typeof value === "object" && "$in" in value) return (value as { $in: unknown[] }).$in.includes(row[key]);
    return row[key] === value;
  });
  const session = { endSession: async () => undefined, withTransaction: async (fn: () => Promise<unknown>) => { const snapshot = structuredClone(state.tables); try { return await fn(); } catch (error) { state.tables = snapshot; throw error; } } };
  const client = { startSession: () => session, db: () => ({ collection: (name: string) => ({
    findOne: async (filter: Row) => state.tables[name].find((row) => matches(row, filter)) ?? null,
    find: (filter: Row) => {
      let rows = state.tables[name].filter((row) => matches(row, filter));
      const cursor = { sort: (order: Record<string, number>) => { rows = [...rows].sort((a, b) => { for (const [key, direction] of Object.entries(order)) { const difference = typeof a[key] === "number" ? Number(a[key]) - Number(b[key]) : String(a[key] ?? "").localeCompare(String(b[key] ?? "")); if (difference) return difference * direction; } return 0; }); return cursor; }, skip: (n: number) => { rows = rows.slice(n); return cursor; }, limit: (n: number) => { rows = rows.slice(0, n); return cursor; }, toArray: async () => structuredClone(rows) };
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
test("registry retains nine supported types and rejects unsafe CTA/unknown types/duplicate selections", () => {
 assert.equal(Object.keys(homepageSectionRegistry).length, 9);
 for (const href of ["javascript:alert(1)", "data:text/html,evil", "//evil.example", "/\\evil.example", "https://user:secret@example.com", "/path\n"]) assert.equal(sectionHref.safeParse(href).success, false);
 assert.equal(sectionHref.parse("/posts"), "/posts");
 assert.equal(sectionInputSchema.safeParse({ ...section, section: { type: "javascript", content: {} } }).success, false);
 assert.equal(sectionInputSchema.safeParse({ ...section, section: { type: "skills", content: { ids: [imageId, imageId], mode: "selected", limit: 6 } } }).success, false);
 assert.equal(managedInputSchema.safeParse({ kind: "contactMessages", data: {} }).success, false);
 assert.equal(managedInputSchema.safeParse({ ...skill, ADMIN_EMAIL: "fake@example.com" }).success, false);
});
test("section create/show/edit/hide/delete persists, preserves timestamps, and allows multiple instances", async () => fixture(async (state) => {
 const a = await createManaged({ kind: "sections", data: section });
 const b = await createManaged({ kind: "sections", data: { ...section, title: "Second instance" } });
 assert.deepEqual(await getHomepageSections(), []);
 const shown = await setManagedStatus("sections", a.id, "published", a.updatedAt);
 assert.equal((await getHomepageSections())[0].title, section.title);
 const createdAt = state.tables.homepageSections[0].createdAt;
 const edited = await updateManaged(a.id, { kind: "sections", data: { ...section, title: "Changed title", subtitle: "Changed subtitle", status: "published" } }, shown.updatedAt);
 assert.equal(edited.id, a.id); assert.deepEqual(state.tables.homepageSections[0].createdAt, createdAt);
 assert.equal((await getHomepageSections())[0].subtitle, "Changed subtitle");
 await assert.rejects(updateManaged(a.id, { kind: "sections", data: section }, shown.updatedAt), RequestError);
 await assert.rejects(deleteManaged("sections", a.id, shown.updatedAt), RequestError);
 const hidden = await setManagedStatus("sections", a.id, "draft", edited.updatedAt); assert.deepEqual(await getHomepageSections(), []);
 await deleteManaged("sections", a.id, hidden.updatedAt); await deleteManaged("sections", b.id, b.updatedAt);
 assert.deepEqual(await getHomepageSections(), []); assert.equal(state.tables.media.length, 2);
}));
test("keyboard reordering normalizes ties, persists order, and rejects stale movement", async () => fixture(async (state) => {
 await createManaged({ kind: "sections", data: { ...section, status: "published" } });
 await createManaged({ kind: "sections", data: { ...section, status: "published", title: "Second" } });
 const before = await getHomepageSections(); const last = state.tables.homepageSections.find((row) => row._id === before[1].id)!;
 const expected = (last.updatedAt as Date).toISOString();
 await moveManaged("sections", before[1].id, "up", expected);
 assert.deepEqual((await getHomepageSections()).map((row) => row.id), [before[1].id, before[0].id]);
 await assert.rejects(moveManaged("sections", before[1].id, "down", expected), RequestError);
 // Both moved records receive new timestamps even when a tied rank stays zero.
 const moved = state.tables.homepageSections.find((row) => row._id === before[1].id)!;
 const stamp = (moved.updatedAt as Date).toISOString();
 await moveManaged("sections", before[1].id, "down", stamp);
 assert.deepEqual((await getHomepageSections()).map((row) => row.id), before.map((row) => row.id));
 await assert.rejects(moveManaged("sections", before[1].id, "up", stamp), RequestError);
}));
test("skills CRUD and selected-section preview never expose draft or deleted related records", async () => fixture(async () => {
 const hidden = await createManaged(skill); const live = await createManaged({ ...skill, data: { ...skill.data, status: "published" } } as ManagedInput);
 const input = sectionInputSchema.parse({ ...section, section: { type: "skills", content: { mode: "selected", ids: [hidden.id, live.id], limit: 6 } } });
 const resolved = await resolveSection(input, "preview", true); assert.equal(resolved.content.type, "skills"); if (resolved.content.type !== "skills") throw new Error(); assert.deepEqual(resolved.content.items.map((item) => item.id), [live.id]);
 const changed = await updateManaged(live.id, { kind: "skills", data: { name: "Edited fixture", category: "", description: "", status: "published", displayOrder: 5 } }, live.updatedAt);
 const refreshed = await resolveSection(input, "preview"); if (refreshed.content.type !== "skills") throw new Error(); assert.equal(refreshed.content.items[0].name, "Edited fixture"); assert.equal(refreshed.content.items[0].category, undefined);
 await deleteManaged("skills", live.id, changed.updatedAt); const empty = await resolveSection(input, "preview"); if (empty.content.type !== "skills") throw new Error(); assert.equal(empty.content.items.length, 0);
}));
test("timeline CRUD validates dates and sections filter kind without inventing dates", async () => fixture(async () => {
 assert.equal(managedInputSchema.safeParse({ kind: "timeline", data: { ...timeline.data, endMonth: "2023-01" } }).success, false);
 const draft = await createManaged(timeline); const live = await setManagedStatus("timeline", draft.id, "published", draft.updatedAt);
 await createManaged({ kind: "timeline", data: { kind: "experience", title: "Fixture role", organization: "Fixture", description: "", startMonth: "", endMonth: "", current: false, status: "published", displayOrder: 0 } });
 const input = sectionInputSchema.parse({ ...section, section: { type: "timeline", content: { kind: "education", limit: 6 } } });
 const result = await resolveSection(input, "test"); if (result.content.type !== "timeline") throw new Error(); assert.equal(result.content.items.length, 1); assert.equal(result.content.items[0].endMonth, undefined); assert.equal(result.content.items[0].current, true);
 const updated = await updateManaged(live.id, { kind: "timeline", data: { kind: "education", title: "Edited fixture", organization: "Fixture", description: "", startMonth: "2024-01", endMonth: "2025-01", current: false, status: "published", displayOrder: 1 } }, live.updatedAt);
 await deleteManaged("timeline", live.id, updated.updatedAt); const empty = await resolveSection(input, "test"); if (empty.content.type !== "timeline") throw new Error(); assert.equal(empty.content.items.length, 0);
}));
test("gallery publication locks images atomically, wrong media rolls back, and hidden references are retained", async () => fixture(async (state) => {
 const input: SectionInput = { ...section, section: { type: "gallery", content: { items: [{ mediaId: imageId, alt: "First" }, { mediaId: galleryId, alt: "Second" }] } } };
 const saved = await createManaged({ kind: "sections", data: input }); assert.equal(state.tables.media[0].status, "draft");
 state.tables.media[1].kind = "document"; await assert.rejects(setManagedStatus("sections", saved.id, "published", saved.updatedAt), RequestError); assert.equal(state.tables.media[0].status, "draft");
 state.tables.media[1].kind = "image"; const shown = await setManagedStatus("sections", saved.id, "published", saved.updatedAt);
 const result = await getHomepageSections(); if (result[0].content.type !== "gallery") throw new Error(); assert.equal(result[0].content.images.length, 2);
 state.tables.mediaUploads[0].state = "deleting"; await assert.rejects(updateManaged(saved.id, { kind: "sections", data: input }, shown.updatedAt), RequestError);
 await setManagedStatus("sections", saved.id, "draft", shown.updatedAt); assert.equal(state.tables.homepageSections.length, 1); assert.deepEqual(await getHomepageSections(), []);
}));
test("public media resolution hides draft images while authorized preview can display them", async () => fixture(async () => {
 const input: SectionInput = { ...section, section: { type: "image-and-text", content: { mediaId: imageId, alt: "Fixture image", blocks: [], imageSide: "right" } } };
 const publicView = await resolveSection(input, "test"); const preview = await resolveSection(input, "test", true);
 if (publicView.content.type !== "image-and-text" || preview.content.type !== "image-and-text") throw new Error(); assert.equal(publicView.content.image, undefined); assert.ok(preview.content.image?.url);
}));
test("project/certificate/post selections hide drafts, preserve manual order, and respect automatic limits", async () => fixture(async (state) => {
 for (const name of ["projects", "certificates", "posts"] as const) {
  const fields = name === "projects" ? { title: "Fixture", slug: "fixture", summary: "Fixture", body: [], technologies: [], featured: true } : name === "certificates" ? { title: "Fixture", issuer: "Fixture" } : { title: "Fixture", slug: "fixture", excerpt: "Fixture", body: [], tags: [], publishedOn: "2025-01-01" };
  const draft = prepareCreate(name, fields); const first = prepareCreate(name, { ...fields, status: "published" }); const second = prepareCreate(name, { ...fields, status: "published", displayOrder: 1 }); state.tables[name].push(draft, first, second);
  const input = sectionInputSchema.parse({ ...section, section: { type: name, content: { mode: "selected", ids: [second._id, draft._id, first._id], limit: 2 } } });
  const view = await resolveSection(input, "test"); if (!("items" in view.content)) throw new Error(); assert.deepEqual(view.content.items.map((item) => item.id), [second._id, first._id]);
  const automatic = await resolveSection(sectionInputSchema.parse({ ...section, section: { type: name, content: { limit: 1 } } }), "test"); if (!("items" in automatic.content)) throw new Error(); assert.equal(automatic.content.items.length, 1);
 }
}));
test("public section and associated record validation fail closed when an adapter returns drafts", async () => fixture(async (state) => {
 const hidden = await createManaged({ kind: "sections", data: section }); state.ignorePublication = true; await assert.rejects(getHomepageSections(), DatabaseUnavailableError);
 state.ignorePublication = false; await deleteManaged("sections", hidden.id, hidden.updatedAt); await createManaged(skill);
 await createManaged({ kind: "sections", data: { ...section, status: "published", section: emptySection("skills") } }); state.ignorePublication = true; await assert.rejects(getHomepageSections(), DatabaseUnavailableError);
}));
test("all nine typed component renderers work and rich text/CTA text render as escaped content", () => {
 const processResult = spawnSync(process.execPath, ["--import", "tsx", "tests/fixtures/render-sections.ts"], { encoding: "utf8", timeout: 30000 });
 assert.equal(processResult.status, 0, processResult.stderr); const { types, html } = JSON.parse(processResult.stdout) as { types: string[]; html: string };
 assert.deepEqual(types.sort(), Object.keys(homepageSectionRegistry).sort()); assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script|<iframe|<[^>]+\son(?:error|load)=/i);
 // Each section has one trusted decorative SVG; user-provided SVG must stay text.
 assert.equal((html.match(/<svg\b/g) || []).length, types.length);
 assert.match(html, /&lt;svg onload=/);
});
