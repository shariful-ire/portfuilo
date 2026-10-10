import { getCollection } from "../src/lib/db/collections";
import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { getDatabase, closeDatabase } from "../src/lib/db/connection";
import { saveSettings, loadSettingsForm } from "../src/lib/settings/store";
import { settingsDefaults } from "../src/lib/settings/schema";
import { presentationDefaults } from "../src/lib/settings/presentation";
import { getPublicSettings } from "../src/lib/settings/public";
import { publishedSitemap } from "../src/lib/seo/sitemap";
import { isReferenced, transaction } from "../src/lib/media/storage";
import { ideaRecordSchema } from "../src/lib/ideas/schema";
import { applyIdeaReview } from "../src/lib/ideas/review-schema";
import { getPublicIdeas } from "../src/lib/ideas/public";

loadEnvConfig(process.cwd());
let stage = "connect";
async function main() {
  const original = process.env.MONGODB_DB_NAME;
  const temporary = `ps_${randomUUID().replaceAll("-", "")}`;
  const origin = "http://localhost:3139";
  let server: ChildProcess | undefined;
  let owned = false;
  process.env.MONGODB_DB_NAME = temporary;
  try {
    assert.notEqual(original, temporary);
    const db = await getDatabase();
    assert.equal((await db.listCollections().toArray()).length, 0); owned = true;
    const presentation = structuredClone(presentationDefaults);
    presentation.animations = false; presentation.accent = "mint";
    presentation.siteName = "Settings verification";
    presentation.pages.find((page) => page.path === "/projects")!.enabled = false;
    const about = presentation.pages.find((page) => page.path === "/about")!;
    Object.assign(about, { enabled: true, inNavigation: true, title: "Verified information", seoTitle: "Verified SEO", blocks: [{ heading: "Safe text", text: '<script>alert("unsafe")</script>' }] });
    const input = { ...settingsDefaults, webFocusTitle: "Saved focus", presentationJson: JSON.stringify(presentation) };
    stage = "save settings";
    await saveSettings(input);
    await closeDatabase();
    stage = "readback";
    const readback = JSON.parse((await loadSettingsForm()).presentationJson);
    stage = "presentation comparison";
    assert.deepEqual(readback, presentation);
    stage = "public focus readback";
    assert.equal((await getPublicSettings()).data.webFocusTitle, "Saved focus");
    stage = "sitemap";
    const sitemap = await publishedSitemap(origin);
    assert.ok(sitemap.some((entry) => entry.url === `${origin}/about`));
    assert.ok(!sitemap.some((entry) => entry.url.startsWith(`${origin}/projects`)));
    // Fixture reference only: no upload or provider operation is simulated.
    stage = "media reference";
    const mediaId = randomUUID();
    await (await getDatabase()).collection("siteSettings").updateOne({ key: "site" }, { $set: { "presentation.logoId": mediaId, "presentation.logoAlt": "Reference fixture" } });
    await transaction(async (session) => { assert.equal(await isReferenced(mediaId, session), true); });
    await saveSettings(input); // Clear fixture before HTTP verification.
    stage = "start server";
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3139"], { windowsHide: true, stdio: "ignore", env: { ...process.env, SITE_URL: origin, BETTER_AUTH_URL: "https://verification.example", CONTACT_PUBLIC_ORIGIN: "https://verification.example" } });
    let ready = false;
    for (let i = 0; i < 40; i++) { try { if ((await fetch(origin)).ok) { ready = true; break; } } catch { /* Wait for startup. */ } await new Promise((resolve) => setTimeout(resolve, 500)); }
    assert.ok(ready, "isolated production server starts");
    stage = "disabled route status";
    for (const path of ["/projects", "/projects/anything"]) { const response = await fetch(origin + path); console.log(`Disabled route ${path}: HTTP ${response.status}`); assert.ok([200, 404].includes(response.status)); const body = await response.text(); assert.ok(body.includes("404 / Page not found")); assert.ok(body.includes("noindex")); assert.ok(!body.includes("Search projects")); }
    stage = "about response";
    const response = await fetch(origin + "/about"); assert.equal(response.status, 200);
    const html = await response.text();
    stage = "about content";
    assert.ok(html.includes("Verified information")); assert.ok(html.includes("Verified SEO"));
    assert.ok(html.includes("&lt;script&gt;")); assert.ok(!html.includes('<script>alert("unsafe")</script>'));
    assert.ok(html.includes('data-motion="off"')); assert.ok(html.includes('data-accent="mint"'));
    stage = "home navigation";
    const home = await (await fetch(origin)).text(); assert.ok(!home.includes('href="/projects"'));
    stage = "auth mutation";
    const unauthorized = await fetch(origin + "/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json", Origin: "https://verification.example" }, body: JSON.stringify(input) });
    console.log(`Unauthenticated settings: HTTP ${unauthorized.status}`); assert.equal(unauthorized.status, 401);
    stage = "idea submission";
    const headers = { "Content-Type": "application/json", Origin: "https://verification.example" };
    const tokenResponse = await fetch(origin + "/api/contact/token", { method: "POST", headers });
    assert.equal(tokenResponse.status, 200); const { token } = await tokenResponse.json();
    const idea = { name: "Isolated fixture", email: "fixture@example.com", title: "Isolated idea fixture", category: "IoT", description: "This is a temporary verification idea, not real portfolio content.", problem: "Verify persistent private idea storage.", collaboration: "Verify consent and review defaults.", storageConsent: true, publicationConsent: false, attributionConsent: false, token, website: "" };
    const submitIdea = (body: object) => fetch(origin + "/api/ideas", { method: "POST", headers, body: JSON.stringify(body) });
    assert.equal((await submitIdea({ ...idea, storageConsent: false })).status, 400);
    assert.equal((await submitIdea({ ...idea, website: "spam" })).status, 400);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    assert.equal((await submitIdea(idea)).status, 201);
    assert.equal((await submitIdea(idea)).status, 409);
    await closeDatabase();
    const ideas = (await getCollection("ideaSubmissions"));
    assert.equal(await ideas.countDocuments(), 1);
    const stored = await ideas.findOne({ title: idea.title });
    assert.equal(stored?.publicationState, "draft"); assert.equal(stored?.approved, false); assert.equal(stored?.storageConsent, true); assert.equal(stored?.publicationConsent, false);
    assert.ok(!(await (await fetch(origin + "/ideas")).text()).includes("fixture@example.com"));
    console.log("Ideas HTTP: missing consent/honeypot rejected, actual save returned 201, replay rejected, private defaults persisted after reconnect.");
    stage = "idea publication privacy";
    const raw = ideaRecordSchema.parse(stored);
    const consented = { ...raw, _id: randomUUID(), publicationConsent: true, attributionConsent: false, adminNotes: "Never publish this private note" };
    const approved = applyIdeaReview(consented, { expectedUpdatedAt: consented.updatedAt.toISOString(), reviewStatus: "interested", adminNotes: consented.adminNotes, publicationState: "published", approved: true, summaryTitle: "Approved isolated collaboration", summaryBody: "A separately edited summary for privacy verification only.", contributor: "" });
    await (await getCollection("ideaSubmissions")).insertOne(approved);
    // Even a malformed legacy published flag must not bypass consent.
    await ideas.updateOne({ _id: stored!._id }, { $set: { publicationState: "published", approved: true, summaryTitle: "Must remain private", summaryBody: "No publication consent" } });
    assert.equal((await getPublicIdeas()).length, 1);
    const publicHtml = await (await fetch(origin + "/ideas")).text();
    assert.ok(publicHtml.includes(approved.summaryTitle));
    for (const privateValue of [raw.email, raw.description, approved.adminNotes, "Must remain private"]) assert.ok(!publicHtml.includes(privateValue));
    await (await getCollection("ideaSubmissions")).updateOne({ _id: approved._id }, { $set: { publicationState: "draft" } });
    assert.equal((await getPublicIdeas()).length, 0);
    for (const path of ["/api/admin/ideas", `/api/admin/ideas/${raw._id}`, "/api/admin/inbox"]) assert.equal((await fetch(origin + path)).status, 401);
    for (const method of ["PUT", "DELETE"]) assert.equal((await fetch(`${origin}/api/admin/ideas/${raw._id}`, { method, headers: { ...headers, "x-admin-email": "owner@example.com", "x-role": "admin" }, body: JSON.stringify({ expectedUpdatedAt: raw.updatedAt.toISOString() }) })).status, 401);
    console.log("Idea publication: consent/approval projection, public edited summary, unpublish, private-field exclusion and rejected anonymous/spoofed admin reads/mutations passed. Admin OAuth flow not simulated.");
    console.log("Passed: real settings save/reconnect/readback, media reference protection, disabled pages/direct URLs, sitemap, metadata, escaped text, theme/motion settings and unauthenticated mutation rejection. No OAuth or upload success claimed.");
  } finally {
    if (server && server.exitCode === null) { const stopped = new Promise((resolve) => server!.once("exit", resolve)); server.kill(); await stopped; }
    if (owned && process.env.MONGODB_DB_NAME === temporary && temporary !== original) await (await getDatabase()).dropDatabase();
    await closeDatabase(); process.env.MONGODB_DB_NAME = original;
  }
}
main().catch((error: unknown) => { console.error(`Presentation verification failed at ${stage}; ${error instanceof Error ? error.name : "unknown error"}. No secrets printed.`); process.exitCode = 1; });
