import "server-only";
import { z } from "zod";
import { RequestError } from "../admin/http";
import { ContactRateError } from "./protection";
export function contactError(error: unknown) {
 const status = error instanceof RequestError ? error.status : error instanceof z.ZodError ? 400 : 503;
 const message = error instanceof RequestError ? error.message : error instanceof z.ZodError ? "Check your name, email, subject, and message, then try again." : "The contact form is temporarily unavailable. Please try again later or use a configured contact link.";
 return Response.json({ message }, { status, headers: { "Cache-Control": "no-store", ...(error instanceof ContactRateError ? { "Retry-After": String(error.retryAfter) } : {}) } });
}
