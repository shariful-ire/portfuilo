import "server-only";
import { notFound } from "next/navigation";
import { getPresentation } from "./public";
import type { Presentation } from "./presentation";
import { getPublishedMedia } from "../db/public-read";

export { getPresentation } from "./public";
export async function requirePublicPage(path: string) {
  const page = (await getPresentation()).pages.find((page) => page.path === path);
  if (!page?.enabled) notFound();
  return page;
}
export async function getBrandAssets(presentation: Presentation) {
  const image = async (id: string) => {
    if (!id) return null;
    try { const asset = await getPublishedMedia(id); return asset?.kind === "image" ? asset : null; }
    catch { return null; }
  };
  const [logo, favicon] = await Promise.all([image(presentation.darkLogoId || presentation.logoId), image(presentation.faviconId)]);
  return { logo, favicon };
}
