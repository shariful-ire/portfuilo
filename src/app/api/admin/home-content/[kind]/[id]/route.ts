import { z } from "zod";
import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { managedKindSchema, managedInputSchema, updateSchema, statusSchema, expectedSchema } from "@/lib/home-manager/schema";
import { updateManaged, setManagedStatus, deleteManaged } from "@/lib/home-manager/store";
import { invalidateHomeContent } from "@/lib/home-manager/invalidate";
export const runtime = "nodejs";
type Context = { params: Promise<{ kind: string; id: string }> };
async function path(context: Context) { const params = await context.params; return { kind: managedKindSchema.parse(params.kind), id: z.uuid().parse(params.id) }; }
export async function PUT(request: Request, context: Context) { try { await authorizeMutation(request); const { kind, id } = await path(context); const body = updateSchema.parse(await readJson(request, 512000)); const result = await updateManaged(id, managedInputSchema.parse({ kind, data: body.data }), body.expectedUpdatedAt); invalidateHomeContent(); return Response.json(result); } catch (error) { return apiError(error); } }
export async function PATCH(request: Request, context: Context) { try { await authorizeMutation(request); const { kind, id } = await path(context); const body = statusSchema.parse(await readJson(request)); const result = await setManagedStatus(kind, id, body.status, body.expectedUpdatedAt); invalidateHomeContent(); return Response.json(result); } catch (error) { return apiError(error); } }
export async function DELETE(request: Request, context: Context) { try { await authorizeMutation(request); const { kind, id } = await path(context); const body = expectedSchema.parse(await readJson(request)); await deleteManaged(kind, id, body.expectedUpdatedAt); invalidateHomeContent(); return Response.json({ deleted: true }); } catch (error) { return apiError(error); } }
