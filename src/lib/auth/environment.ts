import "server-only";
import { z } from "zod";
import { databaseEnvironment } from "../db/connection";

const schema = z.object({
  BETTER_AUTH_SECRET: z.string().trim().min(32),
  BETTER_AUTH_URL: z.url().refine((value) => {
    try {
      const url = new URL(value);
      return !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash && (url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)));
    } catch { return false; }
  }),
  GOOGLE_CLIENT_ID: z.string().trim().min(1),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
  ADMIN_EMAIL: z.email().transform((email) => email.toLowerCase()),
});
export class AuthConfigurationError extends Error {
  constructor() { super("Authentication is not configured. Check the server authentication environment variables."); this.name = "AuthConfigurationError"; }
}
export function authEnvironment() {
  const result = schema.safeParse(process.env);
  if (!result.success) throw new AuthConfigurationError();
  databaseEnvironment();
  return result.data;
}
