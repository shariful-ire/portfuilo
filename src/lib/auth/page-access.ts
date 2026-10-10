import "server-only";
import { redirect } from "next/navigation";
import { requireAdmin } from "./admin";
import { AdminAuthorizationError } from "./policy";

export async function requireAdminPage() {
  try { return await requireAdmin(); }
  catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.code === "UNAUTHENTICATED" ? "/sign-in" : "/access-denied");
    redirect("/sign-in?error=unavailable");
  }
}
