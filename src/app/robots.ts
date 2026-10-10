import type { MetadataRoute } from "next";
import { indexingEnabled, siteOrigin } from "@/lib/seo/config";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return { rules: indexingEnabled() ? { userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/", "/sign-in", "/access-denied"] } : { userAgent: "*", disallow: "/" }, sitemap: origin ? `${origin}/sitemap.xml` : undefined };
}
