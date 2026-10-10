import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { managedKindSchema, managedInputSchema } from "@/lib/home-manager/schema";
import { listManaged } from "@/lib/home-manager/admin";
import { createManaged } from "@/lib/home-manager/store";
import { invalidateHomeContent } from "@/lib/home-manager/invalidate";
export const runtime = "nodejs";
type Context = { params: Promise<{ kind: string }> };
export async function GET(_request: Request, { params }: Context) { try { return Response.json(await listManaged(managedKindSchema.parse((await params).kind)), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
export async function POST(request: Request, { params }: Context) { try { await authorizeMutation(request); const kind = managedKindSchema.parse((await params).kind); const input = managedInputSchema.parse({ kind, data: await readJson(request, 512000) }); const result = await createManaged(input); invalidateHomeContent(); return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
