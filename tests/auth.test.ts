import assert from "node:assert/strict";
import { test } from "node:test";
import { authorizeAdmin, AdminAuthorizationError, type VerifiedSession } from "../src/lib/auth/policy";
import { authEnvironment, AuthConfigurationError } from "../src/lib/auth/environment";

const admin = "owner@example.com";
const session = (): VerifiedSession => ({ user: { id: "trusted-id", email: admin, emailVerified: true }, session: { userId: "trusted-id", expiresAt: new Date(Date.now() + 60_000) } });
const google = async () => ["google"];
const denied = (code: "UNAUTHENTICATED" | "FORBIDDEN") => (error: unknown) => error instanceof AdminAuthorizationError && error.code === code;

test("verified Google admin is accepted and returns only minimal identity", async () => {
  assert.deepEqual(await authorizeAdmin(async () => session(), google, admin.toUpperCase()), { id: "trusted-id", email: admin });
});
test("unauthenticated requests are rejected without querying providers", async () => {
  await assert.rejects(authorizeAdmin(async () => null, async () => { assert.fail("must not query accounts"); }, admin), denied("UNAUTHENTICATED"));
});
test("another Google account is rejected even with a spoofed admin role", async () => {
  const identity = { ...session(), user: { ...session().user, email: "other@example.com", role: "admin" } };
  await assert.rejects(authorizeAdmin(async () => identity, google, admin), denied("FORBIDDEN"));
});
test("matching email without Google verification is denied", async () => {
  const identity = session(); identity.user.emailVerified = false;
  await assert.rejects(authorizeAdmin(async () => identity, google, admin), denied("FORBIDDEN"));
});
test("matching verified email without a linked Google provider is denied", async () => {
  await assert.rejects(authorizeAdmin(async () => session(), async () => ["credential"], admin), denied("FORBIDDEN"));
});
test("expired and invalid sessions are rejected", async () => {
  for (const expiresAt of [new Date(0), new Date(NaN)]) {
    const identity = session(); identity.session.expiresAt = expiresAt;
    await assert.rejects(authorizeAdmin(async () => identity, google, admin), denied("UNAUTHENTICATED"));
  }
});
test("session/user mismatch and missing allowlist fail closed", async () => {
  const identity = session(); identity.session.userId = "someone-else";
  await assert.rejects(authorizeAdmin(async () => identity, google, admin), denied("FORBIDDEN"));
  await assert.rejects(authorizeAdmin(async () => session(), google, ""), denied("FORBIDDEN"));
});
test("changing ADMIN_EMAIL rejects a previously authorized session", async () => {
  await assert.rejects(authorizeAdmin(async () => session(), google, "replacement@example.com"), denied("FORBIDDEN"));
});
test("database failures never authorize a request", async () => {
  await assert.rejects(authorizeAdmin(async () => { throw new Error("database unavailable"); }, google, admin));
  await assert.rejects(authorizeAdmin(async () => session(), async () => { throw new Error("database unavailable"); }, admin));
});
test("missing auth configuration fails without leaking values", () => {
  const previous = process.env.BETTER_AUTH_SECRET;
  delete process.env.BETTER_AUTH_SECRET;
  try { assert.throws(authEnvironment, AuthConfigurationError); }
  finally { if (previous !== undefined) process.env.BETTER_AUTH_SECRET = previous; }
});
