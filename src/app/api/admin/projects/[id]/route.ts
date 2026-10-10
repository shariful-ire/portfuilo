import { z } from "zod";
import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { updateProject, deleteProject } from "@/lib/projects/store";
import { projectUpdateSchema, projectActionSchema, projectDeleteSchema } from "@/lib/projects/schema";
import { invalidateProjects } from "@/lib/projects/invalidate";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try { await authorizeMutation(request); const id = z.uuid().parse((await context.params).id); const body = projectUpdateSchema.parse(await readJson(request, 256_000)); const record = await updateProject(id, body.data, body.expectedUpdatedAt); invalidateProjects(); return Response.json(record); } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { await authorizeMutation(request); const id = z.uuid().parse((await context.params).id); const body = projectActionSchema.parse(await readJson(request, 256_000)); const record = await updateProject(id, { status: body.status }, body.expectedUpdatedAt); invalidateProjects(); return Response.json(record); } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request, context: Context) {
  try { await authorizeMutation(request); const id = z.uuid().parse((await context.params).id); const body = projectDeleteSchema.parse(await readJson(request, 256_000)); await deleteProject(id, body.expectedUpdatedAt); invalidateProjects(); return Response.json({ deleted: true }); } catch (error) { return apiError(error); }
}
