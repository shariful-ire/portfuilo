import assert from "node:assert/strict";
import { test } from "node:test";
import type { MongoClient, ClientSession } from "mongodb";
import { uploadInputSchema, validateFile, detectFileType, IMAGE_LIMIT, PDF_LIMIT } from "../src/lib/media/policy";
import { settingsInputSchema, settingsDefaults } from "../src/lib/settings/schema";
import { readBytes, apiError, RequestError } from "../src/lib/admin/http";
import { cloudinaryServer } from "../src/lib/media/cloudinary";
import { isReferenced, lockReadyMedia } from "../src/lib/media/storage";
import { saveSettings } from "../src/lib/settings/store";
import { AdminAuthorizationError } from "../src/lib/auth/policy";
import { verifyUploadTicket } from "../src/lib/media/ticket";
import type { UploadRecord } from "../src/lib/media/storage";

test("upload tickets reject wrong owner, expiry, tampering, and replay", () => {
  const signature = "a".repeat(64);
  const now = new Date();
  const record: UploadRecord = { _id: "id", ownerId: "admin", signature, timestamp: 1, state: "pending", createdAt: now, updatedAt: now, expiresAt: new Date(now.getTime() + 60_000), revision: 0, input: { name: "a.pdf", mime: "application/pdf", size: 20, alt: "" } };
  assert.equal(verifyUploadTicket(record, "admin", signature), record);
  assert.throws(() => verifyUploadTicket(record, "other", signature));
  assert.throws(() => verifyUploadTicket(record, "admin", "b".repeat(64)));
  assert.throws(() => verifyUploadTicket({ ...record, expiresAt: new Date(0) }, "admin", signature));
  assert.throws(() => verifyUploadTicket({ ...record, state: "ready" }, "admin", signature));
});

test("upload policy rejects unsupported types, image/PDF oversize, and empty alt text", () => {
  const input = { name: "photo.png", mime: "image/png", size: 20, alt: "Portrait" };
  for (const invalid of [{ ...input, mime: "image/svg+xml" }, { ...input, size: IMAGE_LIMIT + 1 }, { ...input, mime: "application/pdf", size: PDF_LIMIT + 1 }, { ...input, alt: "" }, { ...input, name: "../photo.png" }]) assert.equal(uploadInputSchema.safeParse(invalid).success, false);
  assert.equal(uploadInputSchema.safeParse({ ...input, mime: "application/pdf", size: PDF_LIMIT, alt: "" }).success, true);
});
test("file bytes are checked independently from browser MIME and extension", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const input = uploadInputSchema.parse({ name: "photo.png", mime: "image/png", size: png.length, alt: "Portrait" });
  validateFile(png, input);
  assert.equal(detectFileType(Buffer.from("<svg onload='alert(1)'/>")), null);
  assert.throws(() => validateFile(Buffer.from("%PDF-1.7 fake data"), input));
  assert.throws(() => validateFile(png, { ...input, size: 100 }));
});
test("streamed body cap applies even without Content-Length", async () => {
  const request = new Request("http://localhost/upload", { method: "PUT", body: new Uint8Array(50) });
  await assert.rejects(readBytes(request, 20), (error: unknown) => error instanceof RequestError && error.status === 413);
});
test("settings reject editable admin identity, unsafe links, invalid contacts, and arbitrary media IDs", () => {
  for (const invalid of [{ ...settingsDefaults, ADMIN_EMAIL: "attacker@example.com" }, { ...settingsDefaults, github: "javascript:alert(1)" }, { ...settingsDefaults, linkedin: "https://linkedin.com.evil.example/" }, { ...settingsDefaults, photoMediaId: "https://attacker.example/a.jpg" }, { ...settingsDefaults, whatsapp: "123abc" }, { ...settingsDefaults, telegram: "@bad!" }]) assert.equal(settingsInputSchema.safeParse(invalid).success, false);
  const cleared = settingsInputSchema.parse({ ...settingsDefaults, github: "", university: "", country: "" });
  assert.equal(cleared.github, "");
  assert.equal(cleared.university, "");
});
test("authorization errors have 401/403 status and backend errors are sanitized", async () => {
  assert.equal(apiError(new AdminAuthorizationError("UNAUTHENTICATED")).status, 401);
  assert.equal(apiError(new AdminAuthorizationError("FORBIDDEN")).status, 403);
  assert.ok(!(await apiError(new Error("private credential value")).text()).includes("private credential"));
});
test("missing Cloudinary credentials produce configuration guidance, never a simulated upload", () => {
  const old = process.env.CLOUDINARY_API_SECRET;
  delete process.env.CLOUDINARY_API_SECRET;
  try { assert.throws(cloudinaryServer, (error: unknown) => error instanceof RequestError && error.status === 503 && error.message.includes("CLOUDINARY_API_SECRET")); }
  finally { if (old !== undefined) process.env.CLOUDINARY_API_SECRET = old; }
});

async function fakeDatabase(client: unknown, run: () => Promise<void>) {
  const globalDb = globalThis as typeof globalThis & { portfolioMongo?: Promise<MongoClient> };
  const previous = globalDb.portfolioMongo;
  const previousUri = process.env.MONGODB_URI;
  const previousName = process.env.MONGODB_DB_NAME;
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017";
  process.env.MONGODB_DB_NAME = "unit_test_only";
  globalDb.portfolioMongo = Promise.resolve(client as MongoClient);
  try { await run(); } finally {
    globalDb.portfolioMongo = previous;
    if (previousUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previousUri;
    if (previousName === undefined) delete process.env.MONGODB_DB_NAME; else process.env.MONGODB_DB_NAME = previousName;
  }
}
test("deletion reference scan includes draft profile, sharing, project, certificate, post and gallery references", async () => {
  const checked: string[] = [];
  const session = {} as ClientSession;
  await fakeDatabase({ db: () => ({ collection: (name: string) => ({ findOne: async (filter: object) => { checked.push(name); assert.ok(!("status" in filter)); if (name === "projects") assert.deepEqual(filter, { $or: [{ mediaIds: "asset-id" }, { thumbnailId: "asset-id" }, { "gallery.mediaId": "asset-id" }] }); if (name === "certificates") assert.deepEqual(filter, { $or: [{ mediaId: "asset-id" }, { pdfMediaId: "asset-id" }] }); return name === "homepageSections" ? { _id: "reference" } : null; } }) }) }, async () => {
    assert.equal(await isReferenced("asset-id", session), true);
    assert.deepEqual(checked, ["profiles", "siteSettings", "projects", "certificates", "posts", "homepageSections"]);
  });
});
test("reference writers lock only ready uploads, preventing save/deletion races", async () => {
  await fakeDatabase({ db: () => ({ collection: () => ({ updateOne: async (filter: object, update: object) => { assert.deepEqual(filter, { _id: "asset-id", state: "ready" }); assert.deepEqual(update, { $inc: { revision: 1 } }); return { matchedCount: 0 }; } }) }) }, async () => {
    assert.equal(await lockReadyMedia("asset-id", {} as ClientSession), false);
  });
});
test("settings save publishes both singleton records in one transaction and clears optional values", async () => {
  const written: { name: string; record: Record<string, unknown> }[] = [];
  const session = { withTransaction: async (fn: () => Promise<unknown>) => fn(), endSession: async () => undefined };
  await fakeDatabase({ startSession: () => session, db: () => ({ collection: (name: string) => ({ findOne: async () => null, replaceOne: async (_filter: object, record: Record<string, unknown>, options: { session: unknown }) => { assert.equal(options.session, session); written.push({ name, record }); } }) }) }, async () => {
    await saveSettings({ ...settingsDefaults, github: "", country: "", biography: "Confirmed biography", siteTitle: "Saved title" });
    assert.deepEqual(written.map((entry) => entry.name), ["profiles", "siteSettings"]);
    assert.equal(written[0].record.github, undefined);
    assert.equal(written[0].record.country, undefined);
    assert.equal(written[0].record.status, "published");
    assert.equal(written[1].record.title, "Saved title");
  });
});
test("failed media locking aborts settings before either record is written", async () => {
  let written = false;
  const session = { withTransaction: async (fn: () => Promise<unknown>) => fn(), endSession: async () => undefined };
  await fakeDatabase({ startSession: () => session, db: () => ({ collection: () => ({ findOne: async () => null, updateOne: async () => ({ matchedCount: 0 }), replaceOne: async () => { written = true; } }) }) }, async () => {
    await assert.rejects(saveSettings({ ...settingsDefaults, photoMediaId: "33333333-3333-4333-8333-333333333333" }), (error: unknown) => error instanceof RequestError && error.status === 409);
    assert.equal(written, false);
  });
});
