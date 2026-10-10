import "server-only";
import type { Metadata } from "next";
import { getPublicSettings } from "../settings/public";
import { indexingEnabled, siteOrigin } from "./config";

export async function publicMetadata(path: string, title?: string, description?: string, image?: { url: string; alt: string }): Promise<Metadata> {
  const { data, sharing } = await getPublicSettings();
  const origin = siteOrigin();
  const pageTitle = title || data.siteTitle;
  const summary = description || data.siteDescription;
  const cover = image || (sharing ? { url: sharing.url, alt: sharing.alt } : { url: `${origin || "http://localhost:3000"}/og`, alt: `${data.name} portfolio` });
  return {
    title: title ? title : { absolute: data.siteTitle }, description: summary,
    metadataBase: new URL(origin || "http://localhost:3000"),
    alternates: origin ? { canonical: `${origin}${path}` } : undefined,
    robots: { index: indexingEnabled(), follow: true },
    openGraph: { title: pageTitle, description: summary, siteName: data.siteTitle, type: "website", url: origin ? `${origin}${path}` : undefined, locale: "en_US", images: [cover] },
    twitter: { card: "summary_large_image", title: pageTitle, description: summary, images: [cover] },
  };
}
