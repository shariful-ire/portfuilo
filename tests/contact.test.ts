import assert from "node:assert/strict";
import { test } from "node:test";
import { MongoServerError, type MongoClient } from "mongodb";
import { contactActions, emailHref, whatsappValue, telegramValue } from "../src/lib/contact/links";
import { settingsInputSchema, settingsDefaults } from "../src/lib/settings/schema";
import { contactSubmissionSchema } from "../src/lib/contact/schema";
import { issueToken, verifyToken, takeRate, ContactRateError, clientIdentity, publicContactContext } from "../src/lib/contact/protection";
import { ContactConfigurationError } from "../src/lib/contact/environment";
import { saveContactMessage } from "../src/lib/contact/store";
import { markInboxMessage, deleteInboxMessage } from "../src/lib/contact/inbox";
import { RequestError } from "../src/lib/admin/http";
import { parsePublicRecord, DatabaseContentError } from "../src/lib/db/public-read";
import { POST } from "../src/app/api/contact/route";
import { contactError } from "../src/lib/contact/http";
const secret = "unit-test-secret-not-a-real-secret-123456789";
const input = { name: "Fixture sender", email: "fixture@example.com", subject: "Fixture subject", message: "Fixture message, not an actual submission." };
type Row = Record<string, unknown>;
async function fixture(run: (state: { tables: Record<string, Row[]>; failInsert: boolean; acknowledge: boolean }) => Promise<void>) {
 const state = { tables: { contactMessages: [], contactReceipts: [], contactRateLimits: [] } as Record<string, Row[]>, failInsert: false, acknowledge: true };
 const matches = (row: Row, filter: Row) => Object.entries(filter).every(([key, value]) => value instanceof Date ? row[key] instanceof Date && (row[key] as Date).getTime() === value.getTime() : value && typeof value === "object" && "$lt" in value ? Number(row[key]) < Number(value.$lt) : row[key] === value);
 const session = { endSession: async () => undefined, withTransaction: async (fn: () => Promise<unknown>) => { const snapshot = structuredClone(state.tables); try { return await fn(); } catch (error) { state.tables = snapshot; throw error; } } };
 const client = { startSession: () => session, db: () => ({ collection: (name: string) => ({
  insertOne: async (row: Row) => { if (state.failInsert && name === "contactMessages") throw new Error("Simulated write failure"); if (state.tables[name].some((entry) => entry._id === row._id)) throw new MongoServerError({ code: 11000, message: "Duplicate fixture key" }); state.tables[name].push(structuredClone(row)); return { acknowledged: state.acknowledge }; },
  updateOne: async (filter: Row, update: { $set?: Row; $setOnInsert?: Row; $inc?: Record<string, number> }, options?: { upsert?: boolean }) => {
   let row = state.tables[name].find((entry) => matches(entry, filter)); let inserted = false;
   if (!row && options?.upsert) { if (state.tables[name].some((entry) => entry._id === filter._id)) throw new MongoServerError({ code: 11000, message: "Duplicate fixture key" }); row = { _id: filter._id, ...update.$setOnInsert }; state.tables[name].push(row); inserted = true; }
   if (!row) return { acknowledged: state.acknowledge, matchedCount: 0, upsertedCount: 0 };
   Object.assign(row, update.$set); for (const [key, value] of Object.entries(update.$inc ?? {})) row[key] = Number(row[key] ?? 0) + value;
   return { acknowledged: state.acknowledge, matchedCount: inserted ? 0 : 1, upsertedCount: inserted ? 1 : 0 };
  },
  deleteOne: async (filter: Row) => { const before = state.tables[name].length; state.tables[name] = state.tables[name].filter((row) => !matches(row, filter)); return { acknowledged: state.acknowledge, deletedCount: before - state.tables[name].length }; },
 }) }) };
 const globalDb = globalThis as typeof globalThis & { portfolioMongo?: Promise<MongoClient> }; const old = globalDb.portfolioMongo;
 const env = { MONGODB_URI: "mongodb://127.0.0.1:27017", MONGODB_DB_NAME: "unit_test_only", CONTACT_FORM_SECRET: secret, CONTACT_PUBLIC_ORIGIN: "https://portfolio.test", CONTACT_TRUSTED_IP_HEADER: "" };
 const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]])); Object.assign(process.env, env); globalDb.portfolioMongo = Promise.resolve(client as unknown as MongoClient);
 try { await run(state); } finally { globalDb.portfolioMongo = old; for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value; }
}
function request(body: unknown, origin = "https://portfolio.test") { return new Request("https://portfolio.test/api/contact", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) }); }
test("contact settings normalize numbers/usernames/email and build correctly encoded actions", () => {
 const values = settingsInputSchema.parse({ ...settingsDefaults, publicEmail: " User+portfolio@EXAMPLE.COM ", whatsapp: "00880 (1712) 345-678", telegram: "https://t.me/fixture_user/", linkedin: "https://www.linkedin.com/in/fixture-user/?trk=test" });
 assert.equal(values.whatsapp, "+8801712345678"); assert.equal(values.telegram, "fixture_user"); assert.equal(values.publicEmail, "User+portfolio@example.com"); assert.equal(values.linkedin, "https://linkedin.com/in/fixture-user");
 const message = "Hello & welcome? A+B # ?????"; const subject = "Ideas & IoT? #1"; const actions = contactActions(values, message, subject);
 assert.equal(new URL(actions.find((a) => a.channel === "whatsapp")!.href).searchParams.get("text"), message);
 assert.equal(new URL(actions.find((a) => a.channel === "email")!.href).searchParams.get("subject"), subject);
 assert.equal(actions.find((a) => a.channel === "github")?.href, "https://github.com/shariful-ire");
 assert.equal(telegramValue.parse("@fixture_user"), "fixture_user"); assert.equal(whatsappValue.safeParse("01712345678").success, false);
});
test("missing/placeholder/unsafe contact values produce no public actions", () => {
 assert.deepEqual(contactActions({ publicEmail: "[YOUR_EMAIL]", whatsapp: "123abc", telegram: "bad!", github: "javascript:alert(1)", linkedin: "https://linkedin.com.evil.example/in/fixture" }), []);
 assert.deepEqual(contactActions({ linkedin: "https://linkedin.com/in/%ZZ", github: "https://github.com/user-/" }), []);
 assert.deepEqual(contactActions({}), []); assert.deepEqual(contactActions({ github: "https://github.com/", linkedin: "https://linkedin.com/" }), []);
 const href = emailHref("fixture@example.com", "Subject\r\nBcc: other@example.com"); assert.ok(!decodeURIComponent(href).includes("\r\n")); assert.ok(!href.includes("&bcc="));
});
test("server contact validation rejects spoofed state, malformed email, oversize and control characters", () => {
 const token = issueToken(secret);
 for (const change of [{ state: "read" }, { email: "bad" }, { name: "hello\nheader" }, { subject: "bad\r\nheader" }, { message: "x".repeat(10001) }, { message: "tiny" }]) assert.equal(contactSubmissionSchema.safeParse({ ...input, token, website: "", ...change }).success, false);
});
test("signed tokens reject tampering, future/too-fast timestamps and expiration", () => {
 const now = 1800000000000; const token = issueToken(secret, now); assert.throws(() => verifyToken(token, secret, now + 1000), RequestError); assert.throws(() => verifyToken(token, secret, now - 1), RequestError);
 assert.ok(verifyToken(token, secret, now + 2000).id); assert.throws(() => verifyToken(token, secret, now + 3600000), RequestError); assert.throws(() => verifyToken(token, "other-secret", now + 3000), RequestError); assert.throws(() => verifyToken(token.slice(0, -1) + "z", secret, now + 3000), RequestError);
});
test("trusted ingress is explicit; spoofed forwarding headers are ignored by default", async () => fixture(async () => {
 const req = new Request("https://portfolio.test", { headers: { origin: "https://portfolio.test", "x-forwarded-for": "198.51.100.1" } });
 assert.equal(clientIdentity(req, ""), null); assert.equal(clientIdentity(req, "x-forwarded-for"), "198.51.100.1");
 assert.throws(() => clientIdentity(new Request("https://portfolio.test", { headers: { "x-forwarded-for": "198.51.100.1, 127.0.0.1" } }), "x-forwarded-for"), ContactConfigurationError);
 assert.throws(() => publicContactContext(request({}, "https://attacker.test")), (error: unknown) => error instanceof RequestError && error.status === 403);
}));
test("Mongo rate counters enforce a shared atomic limit under concurrent calls and reset by window", async () => fixture(async (state) => {
 const results = await Promise.allSettled(Array.from({ length: 12 }, () => takeRate("test", "fixture@example.com", 3, 60000, secret, 1800000000000)));
 assert.equal(results.filter((r) => r.status === "fulfilled").length, 3); assert.equal(results.filter((r) => r.status === "rejected" && r.reason instanceof ContactRateError).length, 9);
 assert.equal(state.tables.contactRateLimits[0].count, 3); assert.ok(!String(state.tables.contactRateLimits[0]._id).includes("fixture@example.com"));
 await takeRate("test", "fixture@example.com", 3, 60000, secret, 1800000060000); assert.equal(state.tables.contactRateLimits.length, 2);
 const response = contactError(new ContactRateError(60)); assert.equal(response.status, 429); assert.equal(response.headers.get("Retry-After"), "60");
}));
test("unacknowledged rate writes fail closed", async () => fixture(async (state) => { state.acknowledge = false; await assert.rejects(takeRate("test", "id", 3, 60000, secret)); }));
test("contact save commits unread record and receipt, rejects replay even after message deletion", async () => fixture(async (state) => {
 const ticket = verifyToken(issueToken(secret, Date.now() - 3000), secret);
 await saveContactMessage(input, ticket); assert.equal(state.tables.contactMessages.length, 1); assert.equal(state.tables.contactMessages[0].state, "unread"); assert.equal(state.tables.contactReceipts.length, 1);
 await assert.rejects(saveContactMessage(input, ticket), (error: unknown) => error instanceof RequestError && error.status === 409);
 state.tables.contactMessages = []; await assert.rejects(saveContactMessage(input, ticket), RequestError);
}));
test("failed message saves roll back receipts and public endpoint never returns success", async () => fixture(async (state) => {
 state.failInsert = true; const token = issueToken(secret, Date.now() - 3000);
 const response = await POST(request({ ...input, token, website: "" })); assert.equal(response.status, 503); assert.ok(!(await response.json()).saved); assert.equal(state.tables.contactReceipts.length, 0); assert.equal(state.tables.contactMessages.length, 0);
 state.failInsert = false; await saveContactMessage(input, verifyToken(token, secret)); assert.equal(state.tables.contactMessages.length, 1);
}));
test("honeypot and excessive links are rejected without success or message storage", async () => fixture(async (state) => {
 const token = issueToken(secret, Date.now() - 3000);
 for (const changes of [{ website: "spam.example" }, { message: "https://spam.example ".repeat(6) }]) { const response = await POST(request({ ...input, token, website: "", ...changes })); assert.equal(response.status, 400); assert.ok(!(await response.json()).saved); }
 assert.equal(state.tables.contactMessages.length, 0); assert.equal(state.tables.contactReceipts.length, 0);
}));
test("inbox read/unread and delete persist, reject stale writes, and never enter public serialization", async () => fixture(async (state) => {
 await saveContactMessage(input, verifyToken(issueToken(secret, Date.now() - 3000), secret));
 const row = state.tables.contactMessages[0]; const first = (row.updatedAt as Date).toISOString(); await markInboxMessage(String(row._id), "read", first); assert.equal(row.state, "read");
 await assert.rejects(markInboxMessage(String(row._id), "unread", first), RequestError); await assert.rejects(deleteInboxMessage(String(row._id), first), RequestError);
 await markInboxMessage(String(row._id), "unread", (row.updatedAt as Date).toISOString()); assert.equal(row.state, "unread");
 assert.throws(() => parsePublicRecord("contactMessages" as never, row), DatabaseContentError);
 await deleteInboxMessage(String(row._id), (row.updatedAt as Date).toISOString()); assert.equal(state.tables.contactMessages.length, 0);
}));
