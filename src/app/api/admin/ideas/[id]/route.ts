import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { readIdea, updateIdea, deleteIdea } from "@/lib/ideas/admin";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { return Response.json(await readIdea((await params).id), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
export async function PUT(request: Request, { params }: Context) { try { await authorizeMutation(request); await updateIdea((await params).id, await readJson(request, 100000)); revalidatePath("/ideas"); revalidatePath("/dashboard/ideas"); return Response.json({ saved: true }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
export async function DELETE(request: Request, { params }: Context) { try { await authorizeMutation(request); const input = z.object({ expectedUpdatedAt: z.iso.datetime() }).strict().parse(await readJson(request)); await deleteIdea((await params).id, input.expectedUpdatedAt); revalidatePath("/ideas"); revalidatePath("/dashboard/ideas"); return Response.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
