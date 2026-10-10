import assert from "node:assert/strict";
import { test } from "node:test";
import { homepageSectionRegistry, sectionContentSchema } from "../src/lib/content/sections";
import { modelSchemas } from "../src/lib/content/models";
import { prepareCreate, prepareUpdate } from "../src/lib/db/records";
import { parsePublicRecord, listPublished, DatabaseContentError } from "../src/lib/db/public-read";
import { databaseEnvironment, DatabaseConfigurationError } from "../src/lib/db/connection";
import { indexDefinitions } from "../src/lib/db/indexes";
import type { MongoClient } from "mongodb";

const projectInput = { title: "Test fixture", slug: "test-fixture", summary: "Validation only", body: [], technologies: [] };

test("records default to draft; timestamps and IDs cannot be supplied or overwritten", () => {
  const project = prepareCreate("projects", { ...projectInput, _id: "injected", createdAt: new Date(0) });
  assert.equal(project.status, "draft");
  assert.notEqual(project._id, "injected");
  assert.ok(project.createdAt.getTime() > 0);
  const updated = prepareUpdate("projects", project, { _id: "injected", createdAt: new Date(0), title: "Edited" });
  assert.equal(updated._id, project._id);
  assert.equal(updated.createdAt, project.createdAt);
  assert.equal(updated.title, "Edited");
  assert.ok(updated.updatedAt >= project.updatedAt);
});
test("slugs, unsafe URLs, and invalid date ranges fail validation", () => {
  assert.throws(() => prepareCreate("projects", { ...projectInput, slug: "Bad Slug" }));
  assert.throws(() => prepareCreate("projects", { ...projectInput, liveUrl: "javascript:alert(1)" }));
  assert.throws(() => prepareCreate("timelineEntries", { kind: "education", title: "Fixture", organization: "Fixture", startMonth: "2026-09", endMonth: "2025-01" }));
});
test("public serialization rejects drafts and strips unknown private fields", () => {
  const project = prepareCreate("projects", projectInput);
  assert.throws(() => parsePublicRecord("projects", project), DatabaseContentError);
  const published = parsePublicRecord("projects", { ...project, status: "published", adminNotes: "private" });
  assert.equal(published.id, project._id);
  assert.equal(typeof published.createdAt, "string");
  assert.ok(!("adminNotes" in published));
  assert.ok(!("status" in published));
});
test("public media excludes provider metadata", () => {
  const media = prepareCreate("media", { status: "published", provider: "cloudinary", providerKey: "private-key", url: "https://example.com/image.png", kind: "image", mimeType: "image/png", bytes: 100, alt: "Test fixture", originalFilename: "private-file.png" });
  const result = parsePublicRecord("media", media);
  assert.ok(!("providerKey" in result));
  assert.ok(!("originalFilename" in result));
});
test("all nine section types have a typed registry; mismatched payloads fail", () => {
  assert.equal(Object.keys(homepageSectionRegistry).length, 9);
  assert.equal(sectionContentSchema.safeParse({ type: "projects", content: { limit: 6 } }).success, true);
  assert.equal(sectionContentSchema.safeParse({ type: "cta", content: { limit: 6 } }).success, false);
  assert.equal(sectionContentSchema.safeParse({ type: "cta", content: { body: "Test", action: { label: "Test", href: "//evil.example" } } }).success, false);
});
test("unique slugs and singleton/index coverage are defined", () => {
  for (const name of ["projects", "posts"] as const) assert.ok(indexDefinitions[name].some((index) => index.unique && "slug" in index.key && index.key.slug === 1));
  assert.deepEqual(Object.keys(indexDefinitions).sort(), Object.keys(modelSchemas).sort());
});
test("private collections are rejected at runtime, even bypassing TypeScript", async () => {
  // @ts-expect-error Private inbox is deliberately excluded from public collection names.
  await assert.rejects(listPublished("contactMessages"), DatabaseContentError);
});
test("missing configuration is explicit, including public reads", async () => {
  const uri = process.env.MONGODB_URI;
  const name = process.env.MONGODB_DB_NAME;
  delete process.env.MONGODB_URI;
  delete process.env.MONGODB_DB_NAME;
  try {
    assert.throws(databaseEnvironment, DatabaseConfigurationError);
    await assert.rejects(listPublished("projects"), DatabaseConfigurationError);
  } finally {
    if (uri !== undefined) process.env.MONGODB_URI = uri;
    if (name !== undefined) process.env.MONGODB_DB_NAME = name;
  }
});

test("public reader fixes publication filter, bounds pagination, and reports query failures", async () => {
  const globals = globalThis as typeof globalThis & { portfolioMongo?: Promise<MongoClient> };
  const previousClient = globals.portfolioMongo;
  const previousUri = process.env.MONGODB_URI;
  const previousName = process.env.MONGODB_DB_NAME;
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017";
  process.env.MONGODB_DB_NAME = "unit_test_only";
  const published = prepareCreate("projects", { ...projectInput, status: "published" });
  let fail = false;
  const cursor = {
    sort(value: unknown) { assert.deepEqual(value, { displayOrder: 1, _id: 1 }); return this; },
    skip(value: number) { assert.equal(value, 0); return this; },
    limit(value: number) { assert.equal(value, 24); return this; },
    async toArray() { if (fail) throw new Error("sensitive driver details"); return [published]; },
  };
  // Deliberate unit-test adapter; this does not claim a live database check.
  globals.portfolioMongo = Promise.resolve({ db() { return { collection(name: string) {
    assert.equal(name, "projects");
    return { find(filter: unknown, options: { projection: Record<string, number> }) {
      assert.deepEqual(filter, { status: "published" });
      assert.equal(options.projection.slug, 1);
      assert.equal(options.projection.adminNotes, undefined);
      return cursor;
    } };
  } }; } } as unknown as MongoClient);
  try {
    assert.equal((await listPublished("projects"))[0].id, published._id);
    await assert.rejects(listPublished("projects", { limit: 101 }));
    fail = true;
    await assert.rejects(listPublished("projects"), (error: Error) => error.name === "DatabaseUnavailableError" && !error.message.includes("sensitive"));
  } finally {
    globals.portfolioMongo = previousClient;
    if (previousUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previousUri;
    if (previousName === undefined) delete process.env.MONGODB_DB_NAME; else process.env.MONGODB_DB_NAME = previousName;
  }
});


test("optional MongoDB DNS override accepts only IP addresses and preserves default behavior", () => {
 const before = { uri: process.env.MONGODB_URI, name: process.env.MONGODB_DB_NAME, dns: process.env.MONGODB_DNS_SERVERS };
 try {
  process.env.MONGODB_URI = "mongodb://127.0.0.1"; process.env.MONGODB_DB_NAME = "unit_test_only";
  delete process.env.MONGODB_DNS_SERVERS; assert.deepEqual(databaseEnvironment().MONGODB_DNS_SERVERS, []);
  process.env.MONGODB_DNS_SERVERS = "1.1.1.1, 8.8.8.8"; assert.deepEqual(databaseEnvironment().MONGODB_DNS_SERVERS, ["1.1.1.1", "8.8.8.8"]);
  for (const value of ["https://dns.example.com", "invalid", "1.1.1.1:53", "1.1.1.1,8.8.8.8,9.9.9.9,8.8.4.4"]) { process.env.MONGODB_DNS_SERVERS = value; assert.throws(databaseEnvironment, DatabaseConfigurationError); }
 } finally {
  for (const [key, value] of [["MONGODB_URI", before.uri], ["MONGODB_DB_NAME", before.name], ["MONGODB_DNS_SERVERS", before.dns]]) { if (value === undefined) delete process.env[key!]; else process.env[key!] = value; }
 }
});
