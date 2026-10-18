import { z } from "zod";

export const contactLinkUrl = z.string().trim().min(1).max(2000).transform((value, ctx) => {
  try {
    if (/[\u0000-\u0020\u007f\\]/.test(value)) throw new Error();
    const normalized = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
    const url = new URL(normalized);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".")) throw new Error();
    return url.toString();
  } catch {
    ctx.addIssue({ code: "custom", message: "Use a public HTTPS website or app profile link (for example www.example.com/profile)." });
    return z.NEVER;
  }
});
export const customContactLinksSchema = z.array(z.object({ title: z.string().trim().min(1).max(80), url: contactLinkUrl }).strict()).max(30);
export const customContactLinksJsonSchema = z.string().max(70000).default("[]").transform((value, ctx) => {
  try { return JSON.stringify(customContactLinksSchema.parse(JSON.parse(value))); }
  catch { ctx.addIssue({ code: "custom", message: "Each contact needs a title and valid HTTPS link. Maximum 30 contacts." }); return z.NEVER; }
});
export function readCustomContacts(value = "[]") {
  try { return customContactLinksSchema.parse(JSON.parse(value)); } catch { return []; }
}
