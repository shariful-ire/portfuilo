import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { getDatabase, closeDatabase } from "../src/lib/db/connection";
import { ensureDatabaseIndexes } from "../src/lib/db/indexes";
import { prepareCreate } from "../src/lib/db/records";
import { getCollection } from "../src/lib/db/collections";
import { createProject, updateProject, deleteProject } from "../src/lib/projects/store";
import { emptyProject } from "../src/lib/projects/schema";
import { getPublicProject } from "../src/lib/projects/public";
import { createPost, updatePost, deletePost } from "../src/lib/posts/store";
import { emptyPost } from "../src/lib/posts/schema";
import { getPublicPost } from "../src/lib/posts/public";
import { createCertificate, updateCertificate, deleteCertificate } from "../src/lib/certificates/store";
import { emptyCertificate } from "../src/lib/certificates/schema";
import { getPublicCertificates } from "../src/lib/certificates/public";
import { createManaged, moveManaged, setManagedStatus } from "../src/lib/home-manager/store";
import { getHomepageSections } from "../src/lib/home-manager/public";
import { saveSettings } from "../src/lib/settings/store";
import { settingsDefaults } from "../src/lib/settings/schema";
import { getPublicSettings } from "../src/lib/settings/public";
import { saveContactMessage } from "../src/lib/contact/store";
import { publishedSitemap } from "../src/lib/seo/sitemap";

loadEnvConfig(process.cwd());
let stage = "connect";
async function main() {
  const originalName = process.env.MONGODB_DB_NAME;
  const temporaryName = `pv_${randomUUID().replaceAll("-", "")}`;
  assert.notEqual(originalName, temporaryName);
  // Never use the site's database for fixtures or cleanup. No auth/upload success is simulated.
  process.env.MONGODB_DB_NAME = temporaryName;
  let created = false;
  try {
    const db = await getDatabase();
    stage = "verify empty temporary database";
    assert.equal((await db.listCollections({}, { nameOnly: true }).toArray()).length, 0);
    created = true;
    stage = "create test indexes";
    await ensureDatabaseIndexes();
    stage = "create fixture records";
    const asset = prepareCreate("media", { provider: "cloudinary", providerKey: `verification/${randomUUID()}`, url: "https://res.cloudinary.com/verification/image/upload/fixture.png", kind: "image", mimeType: "image/png", bytes: 1, alt: "Isolated test metadata, not a real upload" });
    await (await getCollection("media")).insertOne(asset);
    await db.collection<{ _id: string; state: string }>("mediaUploads").insertOne({ _id: asset._id, state: "ready" });
    const pInput = { ...emptyProject, title: "Isolated verification fixture", slug: "verification-project", summary: "Test only", description: "Test only", problem: "Test only", solution: "Test only", contribution: "Test only", thumbnailId: asset._id, thumbnailAlt: "Test metadata" };
    let project = await createProject(pInput);
    let post = await createPost({ ...emptyPost, title: "Isolated verification fixture", slug: "verification-post", coverMediaId: asset._id, coverAlt: "Test metadata", excerpt: "Test only", markdown: "Verification fixture only." });
    let certificate = await createCertificate({ ...emptyCertificate, title: "Isolated verification fixture", issuer: "Test fixture", mediaId: asset._id, imageAlt: "Test metadata", issuedOn: "2026-10-01", description: "Test only", category: "Verification" });
    await closeDatabase(); // Fresh network connection: not a local component or driver cache.
    stage = "read draft records after reconnect";
    assert.equal(await getPublicProject(pInput.slug), null);
    assert.equal(await getPublicPost(post.data.slug), null);
    assert.equal((await getPublicCertificates()).total, 0);
    assert.equal((await publishedSitemap("https://example.com")).length, 5);
    project = await updateProject(project.id, { status: "published" }, project.updatedAt);
    stage = "publish content";
    post = await updatePost(post.id, { status: "published" }, post.updatedAt);
    certificate = await updateCertificate(certificate.id, { status: "published" }, certificate.updatedAt);
    await closeDatabase();
    stage = "read published content after reconnect";
    assert.equal((await getPublicProject(project.data.slug))?.id, project.id);
    assert.equal((await getPublicPost(post.data.slug))?.id, post.id);
    assert.equal((await getPublicCertificates()).items[0]?.id, certificate.id);
    assert.equal((await publishedSitemap("https://example.com")).length, 7);
    await assert.rejects(createProject(pInput)); // Existing slug, including drafts, stays unique.
    await assert.rejects(updateProject(project.id, { status: "draft" }, "2000-01-01T00:00:00.000Z"));
    const section = { kind: "sections" as const, data: { title: "Verification A", subtitle: "", displayOrder: 0, status: "published" as const, section: { type: "rich-text" as const, content: { blocks: [] } } } };
    stage = "sections and settings";
    const first = await createManaged(section);
    const second = await createManaged({ ...section, data: { ...section.data, title: "Verification B", displayOrder: 1 } });
    await moveManaged("sections", second.id, "up", second.updatedAt);
    await closeDatabase();
    assert.deepEqual((await getHomepageSections()).map((entry) => entry.id), [second.id, first.id]);
    const row = await (await getCollection("homepageSections")).findOne({ _id: first.id });
    await setManagedStatus("sections", first.id, "draft", row!.updatedAt.toISOString());
    await saveSettings({ ...settingsDefaults, biography: "Isolated persistence verification only." });
    const ticket = { id: randomUUID(), expiresAt: new Date(Date.now() + 60_000) };
    const message = { name: "Verification fixture", email: "fixture@example.com", subject: "Isolated verification", message: "This is an isolated database verification fixture." };
    await saveContactMessage(message, ticket);
    stage = "contact persistence and cleanup";
    await closeDatabase();
    assert.equal((await getHomepageSections()).length, 1);
    assert.equal((await getPublicSettings()).data.biography, "Isolated persistence verification only.");
    assert.equal((await (await getCollection("contactMessages")).findOne({ subject: message.subject }))?.state, "unread");
    await assert.rejects(saveContactMessage(message, ticket));
    project = await updateProject(project.id, { status: "draft" }, project.updatedAt);
    post = await updatePost(post.id, { status: "draft" }, post.updatedAt);
    certificate = await updateCertificate(certificate.id, { status: "draft" }, certificate.updatedAt);
    await closeDatabase();
    assert.equal(await getPublicProject(project.data.slug), null);
    assert.equal(await getPublicPost(post.data.slug), null);
    assert.equal((await getPublicCertificates()).total, 0);
    await deleteProject(project.id, project.updatedAt); await deletePost(post.id, post.updatedAt); await deleteCertificate(certificate.id, certificate.updatedAt);
    assert.equal(await (await getCollection("projects")).countDocuments({}), 0);
    console.log("Live isolated MongoDB checks passed: transactional content save/publish/reconnect/unpublish/delete, unique slugs, stale-write rejection, section order/visibility, profile readback, contact storage/replay, published sitemap. Media metadata is a fixture; Google login, real uploads and browser inbox were NOT tested.");
  } finally {
    try {
      if (created) {
        const db = await getDatabase();
        assert.equal(db.databaseName, temporaryName);
        assert.match(db.databaseName, /^pv_[a-f0-9]{32}$/);
        await db.dropDatabase();
        console.log("Only the newly created isolated verification database was removed. Portfolio content was not modified.");
      }
    } finally {
      await closeDatabase();
      if (originalName === undefined) delete process.env.MONGODB_DB_NAME; else process.env.MONGODB_DB_NAME = originalName;
    }
  }
}
main().catch((error: unknown) => { console.error(`Live database verification failed at ${stage} (${error instanceof Error ? error.name : "unknown error"}; code ${typeof error === "object" && error && "code" in error ? String(error.code) : "none"}). No successful verification is claimed; check connectivity, transaction support, and temporary-database permissions.`); process.exitCode = 1; });
