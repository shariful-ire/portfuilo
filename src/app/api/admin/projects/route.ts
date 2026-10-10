import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { listAdminProjects } from "@/lib/projects/admin";
import { createProject } from "@/lib/projects/store";
import { projectInputSchema } from "@/lib/projects/schema";
import { invalidateProjects } from "@/lib/projects/invalidate";
export const runtime = "nodejs";
export async function GET() { try { return Response.json(await listAdminProjects(), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) {
  try { await authorizeMutation(request); const record = await createProject(projectInputSchema.parse(await readJson(request, 256_000))); invalidateProjects(); return Response.json(record, { status: 201, headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}
