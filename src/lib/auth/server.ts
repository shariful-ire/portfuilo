import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { nextCookies } from "better-auth/next-js";
import { getDatabase } from "../db/connection";
import { authEnvironment } from "./environment";

async function createAuth() {
  const env = authEnvironment();
  return betterAuth({
    appName: "Shariful Portfolio",
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
    database: mongodbAdapter(await getDatabase()),
    emailAndPassword: { enabled: false },
    socialProviders: { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: "select_account" } },
    account: { accountLinking: { enabled: false }, encryptOAuthTokens: true },
    user: { changeEmail: { enabled: false }, deleteUser: { enabled: false } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database" },
    advanced: { useSecureCookies: new URL(env.BETTER_AUTH_URL).protocol === "https:" },
    plugins: [nextCookies()],
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  instance ??= createAuth().catch((error: unknown) => { instance = undefined; throw error; });
  return instance;
}
