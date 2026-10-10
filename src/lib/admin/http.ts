import "server-only";
import { z } from "zod";
import { requireAdmin } from "../auth/admin";
import { authEnvironment } from "../auth/environment";
import { AdminAuthorizationError } from "../auth/policy";

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export async function authorizeMutation(request: Request) {
  const admin = await requireAdmin();
  if (request.headers.get("origin") !== new URL(authEnvironment().BETTER_AUTH_URL).origin) throw new RequestError("Request origin is not allowed.", 403);
  return admin;
}
export async function readBytes(request: Request, maximum: number) {
  if (!request.body) throw new RequestError("A request body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maximum) { await reader.cancel(); throw new RequestError("Request exceeds the allowed size.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
export async function readJson(request: Request, maximum = 40_000) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new RequestError("Expected JSON.", 415);
  try { return JSON.parse((await readBytes(request, maximum)).toString("utf8")) as unknown; }
  catch (error) { if (error instanceof RequestError) throw error; throw new RequestError("Invalid JSON."); }
}
export function apiError(error: unknown) {
  let status = 503;
  let message = "Operation unavailable. Check server configuration and database connectivity; transactions require MongoDB Atlas or a replica set.";
  if (error instanceof AdminAuthorizationError) { status = error.code === "UNAUTHENTICATED" ? 401 : 403; message = error.message; }
  else if (error instanceof RequestError) { status = error.status; message = error.message; }
  else if (error instanceof z.ZodError) { status = 400; message = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "); }
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}
