import assert from "node:assert/strict";
import { test } from "node:test";
import { MongoClient, BSON } from "mongodb";
import { getCollection } from "../src/lib/db/collections";
import { certificateInputSchema, moveCertificateIds, type CertificateInput } from "../src/lib/certificates/schema";
import { createCertificate, updateCertificate, deleteCertificate, reorderCertificate } from "../src/lib/certificates/store";
import { getPublicCertificates } from "../src/lib/certificates/public";
import { DatabaseContentError } from "../src/lib/db/public-read";
import { RequestError } from "../src/lib/admin/http";

const imageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pdfId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const input: CertificateInput = { title: "Unit-test certificate", issuer: "Test issuer", mediaId: imageId, imageAlt: "Test certificate scan", pdfMediaId: pdfId, issuedOn: "2026-01-02", credentialId: "", credentialUrl: "", description: "Test fixture only", category: "Testing", displayOrder: 0, status: "draft" };
type Row = Record<string, unknown>;
function media(id: string, kind: "image" | "document"): Row {
  return { _id: id, createdAt: new Date(), updatedAt: new Date(), status: "draft", displayOrder: 0, provider: "cloudinary", providerKey: `portfolio/${id}`, url: `https://res.cloudinary.com/test/image/upload/${id}`, kind, mimeType: kind === "image" ? "image/png" : "application/pdf", bytes: 10, alt: "Test fixture" };
}
async function fixture(run: (state: { tables: Record<string, Row[]>; ignorePublication: boolean }) => Promise<void>) {
  const state = { tables: { certificates: [], media: [media(imageId, "image"), media(pdfId, "document")], mediaUploads: [{ _id: imageId, state: "ready" }, { _id: pdfId, state: "ready" }], contentLocks: [] } as Record<string, Row[]>, ignorePublication: false };
  const matches = (row: Row, filter: Row) => Object.entries(filter).every(([key, value]) => state.ignorePublication && key === "status" ? true : row[key] === value);
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
test("certificate validation rejects invalid dates, unsafe links, missing alt, negative order and extra identity fields", () => {
  for (const invalid of [{ ...input, issuedOn: "2025-02-30" }, { ...input, credentialUrl: "javascript:alert(1)" }, { ...input, credentialUrl: "https://user:password@example.com" }, { ...input, imageAlt: " " }, { ...input, displayOrder: -1 }, { ...input, ADMIN_EMAIL: "fake@example.com" }]) assert.equal(certificateInputSchema.safeParse(invalid).success, false);
  assert.equal(certificateInputSchema.parse({ ...input, pdfMediaId: "" }).pdfMediaId, "");
});
test("real collection BSON serialization omits cleared optional fields", async () => {
  const client = new MongoClient("mongodb://127.0.0.1:27017");
  const globalDb = globalThis as typeof globalThis & { portfolioMongo?: Promise<MongoClient> };
  const old = globalDb.portfolioMongo;
  const uri = process.env.MONGODB_URI;
  const name = process.env.MONGODB_DB_NAME;
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017"; process.env.MONGODB_DB_NAME = "unit_test_only";
  globalDb.portfolioMongo = Promise.resolve(client);
  try {
    const collection = await getCollection("certificates");
    assert.equal(collection.bsonOptions.ignoreUndefined, true);
    const record = BSON.deserialize(BSON.serialize({ title: "Fixture", pdfMediaId: undefined, credentialId: undefined }, collection.bsonOptions));
    assert.deepEqual(record, { title: "Fixture" });
  } finally { globalDb.portfolioMongo = old; await client.close(); if (uri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = uri; if (name === undefined) delete process.env.MONGODB_DB_NAME; else process.env.MONGODB_DB_NAME = name; }
});
test("draft -> publish -> public image/PDF -> unpublish flow persists without exposing drafts", async () => fixture(async (state) => {
  const created = await createCertificate(input);
  assert.equal(state.tables.certificates.length, 1);
  assert.equal(state.tables.media[0].status, "draft");
  assert.equal((await getPublicCertificates()).items.length, 0);
  const published = await updateCertificate(created.id, { status: "published" }, created.updatedAt);
  const visible = await getPublicCertificates({ category: "Testing" });
  assert.equal(visible.items.length, 1);
  assert.ok(visible.items[0].imageUrl && visible.items[0].pdfUrl);
  assert.equal(visible.items[0].imageAlt, input.imageAlt);
  assert.ok(!("providerKey" in visible.items[0]));
  assert.deepEqual(visible.categories, ["Testing"]);
  await updateCertificate(created.id, { status: "draft" }, published.updatedAt);
  assert.equal((await getPublicCertificates()).items.length, 0);
  assert.deepEqual((await getPublicCertificates()).categories, []);
}));
test("invalid PDF rolls back publication of both certificate and image", async () => fixture(async (state) => {
  state.tables.media[1].kind = "image";
  await assert.rejects(createCertificate({ ...input, status: "published" }), RequestError);
  assert.equal(state.tables.certificates.length, 0);
  assert.equal(state.tables.media[0].status, "draft");
}));
test("deleting media cannot be attached, even to a draft", async () => fixture(async (state) => {
  state.tables.mediaUploads[0].state = "deleting";
  await assert.rejects(createCertificate(input), (error: unknown) => error instanceof RequestError && error.status === 409);
  assert.equal(state.tables.certificates.length, 0);
}));
test("editing retains identity/creation date, clears optional fields, and rejects stale updates/deletes", async () => fixture(async (state) => {
  const first = await createCertificate({ ...input, credentialId: "old" });
  const createdAt = state.tables.certificates[0].createdAt;
  const edited = await updateCertificate(first.id, { ...input, title: "Changed", pdfMediaId: "", credentialId: "" }, first.updatedAt);
  assert.equal(edited.id, first.id);
  assert.deepEqual(state.tables.certificates[0].createdAt, createdAt);
  assert.equal(state.tables.certificates[0].pdfMediaId, undefined);
  assert.equal(state.tables.certificates[0].credentialId, undefined);
  await assert.rejects(updateCertificate(first.id, input, first.updatedAt), (error: unknown) => error instanceof RequestError && error.status === 409);
  await assert.rejects(deleteCertificate(first.id, first.updatedAt), RequestError);
  await deleteCertificate(first.id, edited.updatedAt);
  assert.equal(state.tables.certificates.length, 0);
  assert.equal(state.tables.media.length, 2);
}));
test("up/down ordering persists and handles equal display orders", async () => fixture(async () => {
  const a = await createCertificate({ ...input, title: "A", status: "published" });
  const b = await createCertificate({ ...input, title: "B", displayOrder: 1, status: "published" });
  await reorderCertificate(b.id, "up");
  assert.deepEqual((await getPublicCertificates()).items.map((row) => row.id), [b.id, a.id]);
  await reorderCertificate(b.id, "down");
  assert.deepEqual((await getPublicCertificates()).items.map((row) => row.id), [a.id, b.id]);
  assert.deepEqual(moveCertificateIds(["a", "b"], "a", "up"), ["a", "b"]);
  assert.throws(() => moveCertificateIds(["a"], "missing", "down"));
}));
test("equal display-order values are normalized during a move", async () => fixture(async () => {
  await createCertificate({ ...input, title: "A", status: "published" });
  await createCertificate({ ...input, title: "B", status: "published" });
  const before = (await getPublicCertificates()).items.map((row) => row.id);
  await reorderCertificate(before[1], "up");
  assert.deepEqual((await getPublicCertificates()).items.map((row) => row.id), [before[1], before[0]]);
}));
test("unpublishing remains possible if a previously published asset becomes unavailable", async () => fixture(async (state) => {
  const saved = await createCertificate({ ...input, status: "published" });
  state.tables.mediaUploads[0].state = "deleting";
  await updateCertificate(saved.id, { status: "draft" }, saved.updatedAt);
  assert.equal((await getPublicCertificates()).items.length, 0);
}));
test("category filtering and pagination exclude other categories and drafts", async () => fixture(async () => {
  await createCertificate({ ...input, category: "Private category" });
  await createCertificate({ ...input, title: "Public A", status: "published" });
  await createCertificate({ ...input, title: "Public B", displayOrder: 1, status: "published" });
  await createCertificate({ ...input, category: "Other", status: "published" });
  const result = await getPublicCertificates({ category: "Testing", limit: 1, page: 2 });
  assert.equal(result.total, 2);
  assert.equal(result.items[0].title, "Public B");
  assert.deepEqual(result.categories, ["Other", "Testing"]);
}));
test("public reader fails closed if an adapter unexpectedly returns a draft", async () => fixture(async (state) => {
  await createCertificate(input); state.ignorePublication = true;
  await assert.rejects(getPublicCertificates(), DatabaseContentError);
}));
