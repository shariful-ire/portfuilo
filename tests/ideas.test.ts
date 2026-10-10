import assert from "node:assert/strict";
import { test } from "node:test";
import { ideaInputSchema, ideaRecordSchema } from "../src/lib/ideas/schema";
import { parsePublicRecord } from "../src/lib/db/public-read";
import { issueToken, verifyToken } from "../src/lib/contact/protection";
import { presentationSchema, presentationDefaults } from "../src/lib/settings/presentation";
import { applyIdeaReview, ideaReviewSchema, publicIdeaProjection, publicIdeaSummary } from "../src/lib/ideas/review-schema";

export const ideaFixture = { name: "Test contributor", email: "private@example.com", organization: "", title: "Test collaboration", category: "IoT" as const, description: "A test-only idea with enough description for validation.", problem: "A test-only problem statement.", collaboration: "Discuss a test-only collaboration.", referenceUrl: "", timeline: "", storageConsent: true as const, publicationConsent: false, attributionConsent: false };
test("idea submissions require consent, bounded text and safe URLs; visitor review fields are rejected", () => {
  assert.equal(ideaInputSchema.safeParse(ideaFixture).success, true);
  for (const patch of [{ storageConsent: false }, { description: "short" }, { referenceUrl: "javascript:alert(1)" }, { referenceUrl: "https://user:password@example.com" }, { title: "x".repeat(201) }, { approved: true }, { publicationState: "published" }, { adminNotes: "spoof" }]) assert.equal(ideaInputSchema.safeParse({ ...ideaFixture, ...patch }).success, false);
});
test("new ideas default to private drafts with no approval and cannot use generic public readers", () => {
  const record = ideaRecordSchema.parse({ ...ideaFixture, _id: "33333333-3333-4333-8333-333333333333", createdAt: new Date(), updatedAt: new Date(), consentAt: new Date() });
  assert.equal(record.publicationState, "draft"); assert.equal(record.approved, false); assert.equal(record.reviewStatus, "new");
  // Deliberately probe the runtime collection allowlist with a forged name.
  assert.throws(() => parsePublicRecord("ideaSubmissions" as never, record));
});
test("ideas reuse expiring signed anti-spam tokens, not browser timestamps", () => {
  const secret = "test-only-idea-token-key-not-a-real-secret"; const now = Date.now(); const token = issueToken(secret, now);
  assert.throws(() => verifyToken(token, secret, now + 100));
  assert.throws(() => verifyToken(token, secret, now + 3600001));
  assert.throws(() => verifyToken(token, "other", now + 3000));
  assert.ok(verifyToken(token, secret, now + 3000).id);
});
test("legacy presentation settings gain the supported Ideas page without losing owner labels", () => {
  const old = structuredClone(presentationDefaults); old.pages = old.pages.filter((page) => page.path !== "/ideas"); old.pages[0].label = "My work";
  const parsed = presentationSchema.parse(old); assert.equal(parsed.pages[0].label, "My work"); assert.equal(parsed.pages.find((page) => page.path === "/ideas")?.enabled, true);
});

const record = () => ideaRecordSchema.parse({ ...ideaFixture, _id: "33333333-3333-4333-8333-333333333333", createdAt: new Date(), updatedAt: new Date(), consentAt: new Date(), adminNotes: "PRIVATE NOTES", description: "PRIVATE RAW SUBMISSION TEXT" });
const review = () => ({ expectedUpdatedAt: new Date().toISOString(), reviewStatus: "interested" as const, adminNotes: "Private review", publicationState: "published" as const, approved: true, summaryTitle: "Approved topic", summaryBody: "An independently edited public summary.", contributor: "" });
test("publication requires immutable sender consent, explicit approval and a separate summary", () => {
  const row = record();
  assert.throws(() => applyIdeaReview(row, review()));
  const consented = { ...row, publicationConsent: true };
  for (const patch of [{ approved: false }, { summaryBody: "" }, { summaryTitle: "" }]) assert.throws(() => applyIdeaReview(consented, { ...review(), ...patch }));
  const published = applyIdeaReview(consented, review());
  assert.equal(published.publicationState, "published");
  assert.equal(published.email, row.email); assert.equal(published.description, row.description);
  assert.ok(published.updatedAt > row.updatedAt);
  assert.equal(applyIdeaReview(published, { ...review(), publicationState: "draft", approved: false }).publicationState, "draft");
  for (const patch of [{ publicationConsent: true }, { attributionConsent: true }, { email: "other@example.com" }, { description: "overwrite" }]) assert.equal(ideaReviewSchema.safeParse({ ...review(), ...patch }).success, false);
});
test("public summary serialization excludes raw submissions, emails and notes and fails closed", () => {
  const row = { ...record(), publicationConsent: true, approved: true, publicationState: "published", summaryTitle: "Public title", summaryBody: "Public body", contributor: "Hidden contributor", attributionConsent: false };
  const summary = publicIdeaSummary(row)!;
  assert.deepEqual(Object.keys(summary).sort(), ["id", "title", "body", "category", "contributor", "updatedAt"].sort());
  assert.equal(summary.contributor, "");
  assert.ok(!JSON.stringify(summary).includes(row.email)); assert.ok(!JSON.stringify(summary).includes(row.adminNotes)); assert.ok(!JSON.stringify(summary).includes(row.description));
  for (const key of ["email", "name", "description", "problem", "collaboration", "adminNotes"]) assert.ok(!(key in publicIdeaProjection));
  for (const patch of [{ publicationConsent: false }, { approved: false }, { publicationState: "draft" }, { summaryBody: "" }, { summaryBody: row.email }]) assert.equal(publicIdeaSummary({ ...row, ...patch }), null);
});
test("attribution requires separate consent and public fields reject email addresses", () => {
  const row = { ...record(), publicationConsent: true };
  assert.throws(() => applyIdeaReview(row, { ...review(), contributor: "Contributor" }));
  const published = applyIdeaReview({ ...row, attributionConsent: true }, { ...review(), contributor: "Contributor" });
  assert.equal(publicIdeaSummary(published)?.contributor, "Contributor");
  assert.throws(() => applyIdeaReview(row, { ...review(), summaryBody: row.email }));
});
