import { z } from "zod";
export const contactEmail = z.string().trim().max(254).pipe(z.email()).transform((value) => { const at = value.lastIndexOf("@"); return value.slice(0, at) + value.slice(at).toLowerCase(); });
export const whatsappValue = z.string().trim().max(40).transform((value) => { const cleaned = value.replace(/[ ()-]/g, "").replace(/^00/, "+"); return cleaned && !cleaned.startsWith("+") ? `+${cleaned}` : cleaned; }).pipe(z.string().regex(/^\+[1-9]\d{6,14}$/, "Use a full international number, including country code"));
export const telegramValue = z.string().trim().max(100).transform((value) => value.replace(/^https:\/\/(?:www\.)?t\.me\//i, "").replace(/\/$/, "").replace(/^@/, "")).pipe(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/, "Use a valid Telegram username"));
function social(host: string, path: RegExp) { return z.string().trim().max(2000).transform((value, ctx) => {
 try { if (/[\u0000-\u0020\u007f\\]/.test(value)) throw new Error(); const url = new URL(value); if (url.protocol !== "https:" || url.username || url.password || url.port || ![host, `www.${host}`].includes(url.hostname) || !path.test(decodeURIComponent(url.pathname))) throw new Error(); url.hostname = host; url.search = ""; url.hash = ""; return url.toString().replace(/\/$/, ""); }
 catch { ctx.addIssue({ code: "custom", message: `Use an HTTPS ${host} profile${host === "github.com" ? " or repository" : ""} URL` }); return z.NEVER; }
 }); }
export const githubValue = social("github.com", /^\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?(?:\/[a-zA-Z0-9_.-]+)?\/?$/);
export const linkedinValue = social("linkedin.com", /^\/in\/[\p{L}\p{N}_-]+\/?$/u);
export function optionalContact(schema: z.ZodType<string, string>) { return z.string().trim().pipe(z.union([z.literal(""), schema])).default(""); }
export type ContactValues = { publicEmail?: string; whatsapp?: string; telegram?: string; github?: string; linkedin?: string };
export type ContactAction = { channel: "email" | "whatsapp" | "telegram" | "github" | "linkedin"; label: string; href: string };
export function emailHref(value: string, subject = "Portfolio enquiry") {
 const email = contactEmail.parse(value); return `mailto:${encodeURIComponent(email).replace(/%40/g, "@")}?subject=${encodeURIComponent(subject.replace(/[\r\n]/g, " "))}`;
}
export function contactActions(values: ContactValues, message = "Hello Shariful!", subject = "Portfolio enquiry"): ContactAction[] {
 const actions: ContactAction[] = [];
 const email = contactEmail.safeParse(values.publicEmail); if (email.success) actions.push({ channel: "email", label: "Email", href: emailHref(email.data, subject) });
 const github = githubValue.safeParse(values.github); if (github.success) actions.push({ channel: "github", label: "GitHub", href: github.data });
 const linkedin = linkedinValue.safeParse(values.linkedin); if (linkedin.success) actions.push({ channel: "linkedin", label: "LinkedIn", href: linkedin.data });
 const whatsapp = whatsappValue.safeParse(values.whatsapp); if (whatsapp.success) actions.push({ channel: "whatsapp", label: "WhatsApp", href: `https://wa.me/${whatsapp.data.slice(1)}?text=${encodeURIComponent(message)}` });
 const telegram = telegramValue.safeParse(values.telegram); if (telegram.success) actions.push({ channel: "telegram", label: "Telegram", href: `https://t.me/${encodeURIComponent(telegram.data)}` });
 return actions;
}
