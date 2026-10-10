import "server-only";
import { z } from "zod";
export class ContactConfigurationError extends Error { constructor() { super("Contact form is not configured."); } }
export function contactEnvironment() {
 const secret = z.string().min(32).safeParse(process.env.CONTACT_FORM_SECRET);
 const originValue = process.env.CONTACT_PUBLIC_ORIGIN || process.env.BETTER_AUTH_URL;
 try {
  const url = new URL(originValue ?? "");
  if (!secret.success || url.username || url.password || url.pathname !== "/" || url.search || url.hash || !(url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) throw new Error();
  const ipHeader = process.env.CONTACT_TRUSTED_IP_HEADER?.trim().toLowerCase() || "";
  if (ipHeader && !/^[a-z0-9-]{1,100}$/.test(ipHeader)) throw new Error();
  return { secret: secret.data, origin: url.origin, ipHeader };
 } catch { throw new ContactConfigurationError(); }
}
