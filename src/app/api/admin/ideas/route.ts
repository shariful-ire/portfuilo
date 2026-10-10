import { apiError } from "@/lib/admin/http";
import { listIdeas } from "@/lib/ideas/admin";
export async function GET(request: Request) {
  try { const query = Object.fromEntries(new URL(request.url).searchParams); return Response.json(await listIdeas(query), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}
