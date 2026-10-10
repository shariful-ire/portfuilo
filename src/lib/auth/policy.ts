import "server-only";

export class AdminAuthorizationError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code === "UNAUTHENTICATED" ? "Sign in to continue." : "This account cannot administer this site.");
    this.name = "AdminAuthorizationError";
  }
}
export type VerifiedSession = {
  user: { id: string; email: string; emailVerified: boolean };
  session: { userId: string; expiresAt: Date };
};
// Trusted server inputs only. Request handlers must use requireAdmin(), which
// accepts no caller-supplied identity, email, role, or session.
export async function authorizeAdmin(loadSession: () => Promise<VerifiedSession | null>, loadProviders: () => Promise<string[]>, adminEmail: string) {
  const result = await loadSession();
  if (!result || !Number.isFinite(result.session.expiresAt.getTime()) || result.session.expiresAt.getTime() <= Date.now()) throw new AdminAuthorizationError("UNAUTHENTICATED");
  if (!adminEmail || !result.user.emailVerified || result.user.id !== result.session.userId || result.user.email.toLowerCase() !== adminEmail.toLowerCase()) throw new AdminAuthorizationError("FORBIDDEN");
  if (!(await loadProviders()).includes("google")) throw new AdminAuthorizationError("FORBIDDEN");
  return { id: result.user.id, email: result.user.email };
}
