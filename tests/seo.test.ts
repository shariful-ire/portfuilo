import assert from "node:assert/strict";
import { test } from "node:test";
import { siteOrigin, indexingEnabled } from "../src/lib/seo/config";
import { sitemapEntries, xmlEscape } from "../src/lib/seo/sitemap";

test("SEO origin rejects credentials, unsafe protocols, paths and queries", () => {
  for (const value of ["javascript:alert(1)", "https://user:password@example.com", "https://example.com/path", "https://example.com/?x=1", "https://example.com/#x", "http://example.com", "not a url"]) assert.equal(siteOrigin(value), undefined);
  assert.equal(siteOrigin("https://example.com/"), "https://example.com");
  assert.equal(siteOrigin("http://localhost:3000"), "http://localhost:3000");
});
test("indexing requires explicit opt-in and a configured HTTPS origin", () => {
  const previous = { site: process.env.SITE_URL, indexing: process.env.ALLOW_INDEXING };
  try {
    process.env.SITE_URL = "https://example.com"; delete process.env.ALLOW_INDEXING; assert.equal(indexingEnabled(), false);
    process.env.ALLOW_INDEXING = "true"; assert.equal(indexingEnabled(), true);
    process.env.SITE_URL = "http://localhost:3000"; assert.equal(indexingEnabled(), false);
    delete process.env.SITE_URL; assert.equal(indexingEnabled(), false);
  } finally {
    if (previous.site === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = previous.site;
    if (previous.indexing === undefined) delete process.env.ALLOW_INDEXING; else process.env.ALLOW_INDEXING = previous.indexing;
  }
});
test("sitemap includes published detail pages beyond the first listing page and excludes private routes", () => {
  const rows = Array.from({ length: 125 }, (_, i) => ({ slug: `fixture-${i}`, status: "published", updatedAt: new Date("2026-10-01") }));
  const entries = sitemapEntries("https://example.com", rows, [rows[0]]);
  assert.equal(entries.length, 130);
  assert.ok(entries.some((entry) => entry.url.endsWith("/projects/fixture-124")));
  assert.ok(entries.some((entry) => entry.url.endsWith("/posts/fixture-0")));
  assert.ok(entries.every((entry) => !/dashboard|sign-in|api/.test(entry.url)));
  assert.equal(entries[4].lastModified, "2026-10-01T00:00:00.000Z");
});
test("sitemap fails closed on drafts or unsafe slugs and escapes XML", () => {
  assert.throws(() => sitemapEntries("https://example.com", [{ slug: "private", status: "draft", updatedAt: new Date() }], []));
  assert.throws(() => sitemapEntries("https://example.com", [], [{ slug: "../dashboard", status: "published", updatedAt: new Date() }]));
  assert.equal(xmlEscape('<a x="&">'), "&lt;a x=&quot;&amp;&quot;&gt;");
});
