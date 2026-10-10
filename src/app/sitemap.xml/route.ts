import { siteOrigin } from "@/lib/seo/config";
import { publishedSitemap, xmlEscape } from "@/lib/seo/sitemap";
export const dynamic = "force-dynamic";
export async function GET() {
  const origin = siteOrigin();
  if (!origin) return new Response("Configure a valid SITE_URL to enable the sitemap.", { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const entries = await publishedSitemap(origin);
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(({ url, lastModified }) => `<url><loc>${xmlEscape(url)}</loc>${lastModified ? `<lastmod>${lastModified}</lastmod>` : ""}</url>`).join("")}</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store" } });
  } catch { return new Response("Sitemap temporarily unavailable.", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" } }); }
}
