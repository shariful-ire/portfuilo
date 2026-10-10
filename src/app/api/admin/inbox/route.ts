import { apiError } from "@/lib/admin/http";
import { listInbox } from "@/lib/contact/inbox";
import { inboxQuerySchema } from "@/lib/contact/schema";
export async function GET(request: Request) { try { const params = new URL(request.url).searchParams; const query = inboxQuerySchema.parse({ q: params.get("q") ?? "", page: params.get("page") ?? 1, state: params.get("state") ?? "all" }); return Response.json(await listInbox(query), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
