import "server-only";

export function siteOrigin(value = process.env.SITE_URL): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return undefined;
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return undefined;
    return url.origin;
  } catch { return undefined; }
}
export function indexingEnabled() {
  const origin = siteOrigin();
  return process.env.ALLOW_INDEXING === "true" && !!origin && new URL(origin).protocol === "https:";
}
