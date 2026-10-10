import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { readInboxMessage, markInboxMessage, deleteInboxMessage } from "@/lib/contact/inbox";
import { inboxStatusSchema, inboxDeleteSchema } from "@/lib/contact/schema";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { return Response.json(await readInboxMessage(z.uuid().parse((await params).id)), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
export async function PATCH(request: Request, { params }: Context) { try { await authorizeMutation(request); const id = z.uuid().parse((await params).id); const data = inboxStatusSchema.parse(await readJson(request)); await markInboxMessage(id, data.state, data.expectedUpdatedAt); revalidatePath("/dashboard/inbox"); return Response.json({ updated: true }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
export async function DELETE(request: Request, { params }: Context) { try { await authorizeMutation(request); const id = z.uuid().parse((await params).id); const data = inboxDeleteSchema.parse(await readJson(request)); await deleteInboxMessage(id, data.expectedUpdatedAt); revalidatePath("/dashboard/inbox"); return Response.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
