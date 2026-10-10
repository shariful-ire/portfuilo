import { z } from "zod";
import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { updatePost, deletePost } from "@/lib/posts/store";
import { postUpdateSchema, postActionSchema, postDeleteSchema } from "@/lib/posts/schema";
import { invalidatePosts } from "@/lib/posts/invalidate";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try { await authorizeMutation(request); const id = z.uuid().parse((await context.params).id); const body = postUpdateSchema.parse(await readJson(request, 512_000)); const record = await updatePost(id, body.data, body.expectedUpdatedAt); invalidatePosts(); return Response.json(record); } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { await authorizeMutation(request); const id = z.uuid().parse((await context.params).id); const body = postActionSchema.parse(await readJson(request, 512_000)); const record = await updatePost(id, { status: body.status }, body.expectedUpdatedAt); invalidatePosts(); return Response.json(record); } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request, context: Context) {
  try { await authorizeMutation(request); const id = z.uuid().parse((await context.params).id); const body = postDeleteSchema.parse(await readJson(request, 512_000)); await deletePost(id, body.expectedUpdatedAt); invalidatePosts(); return Response.json({ deleted: true }); } catch (error) { return apiError(error); }
}
