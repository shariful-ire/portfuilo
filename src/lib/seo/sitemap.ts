import { getPresentation } from "../settings/public";
import "server-only";
import { z } from "zod";
import { slugSchema } from "../content/models";
import { getDatabase, DatabaseUnavailableError } from "../db/connection";

const entry = z.object({ slug: slugSchema, status: z.literal("published"), updatedAt: z.date() });
export function sitemapEntries(origin: string, projects: unknown[], posts: unknown[]) {
  if (projects.length + posts.length > 49_996) throw new Error("Sitemap splitting is required.");
  return [
    ...["/", "/projects", "/certificates", "/posts"].map((path) => ({ url: origin + path, lastModified: undefined as string | undefined })),
    ...([ ["projects", projects], ["posts", posts] ] as const).flatMap(([kind, records]) => records.map((record) => {
      const parsed = entry.parse(record); // Fail closed even if an adapter ignores the published filter.
      return { url: `${origin}/${kind}/${parsed.slug}`, lastModified: parsed.updatedAt.toISOString() };
    })),
  ];
}
export async function publishedSitemap(origin: string) {
  try {
    const db = await getDatabase();
    const read = (name: string) => db.collection(name).find({ status: "published" }, { projection: { slug: 1, status: 1, updatedAt: 1 }, maxTimeMS: 5000 }).sort({ slug: 1 }).limit(50_001).toArray();
    const [projects, posts] = await Promise.all([read("projects"), read("posts")]);
    const presentation = await getPresentation();
    const disabled = presentation.pages.filter((page) => !page.enabled).map((page) => page.path);
    const entries = sitemapEntries(origin, projects, posts).filter((entry) => !disabled.some((path) => entry.url === origin + path || entry.url.startsWith(origin + path + "/")));
    if (presentation.pages.find((page) => page.path === "/about")?.enabled) entries.push({ url: origin + "/about", lastModified: undefined });
    if (presentation.pages.find((page) => page.path === "/ideas")?.enabled) entries.push({ url: origin + "/ideas", lastModified: undefined });
    if (presentation.pages.find(page=>page.path==="/products")?.enabled) {
      entries.push({url:origin+"/products",lastModified:undefined});
      for(const record of await read("products")) {const parsed=entry.parse(record);entries.push({url:`${origin}/products/${parsed.slug}`,lastModified:parsed.updatedAt.toISOString()});}
    }
    if(entries.length>50000)throw new Error("Sitemap splitting required");
    return entries;
  } catch { throw new DatabaseUnavailableError(); }
}
export function xmlEscape(value: string) { return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!); }
