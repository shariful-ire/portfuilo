import { listAdminMedia } from "@/lib/media/list";
import { apiError } from "@/lib/admin/http";
export const runtime = "nodejs";
export async function GET() {
  try { return Response.json(await listAdminMedia(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}
