import "server-only";
import { headers } from "next/headers";
import { getAuth } from "./server";
import { authEnvironment } from "./environment";
import { authorizeAdmin } from "./policy";

// Mandatory guard for every future privileged read, mutation, and upload.
export async function requireAdmin() {
  const env = authEnvironment();
  const auth = await getAuth();
  const requestHeaders = await headers();
  return authorizeAdmin(
    () => auth.api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } }),
    async () => (await auth.api.listUserAccounts({ headers: requestHeaders })).map((account) => account.providerId),
    env.ADMIN_EMAIL,
  );
}
