import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { managedKindSchema, moveSchema } from "@/lib/home-manager/schema";
import { moveManaged } from "@/lib/home-manager/store";
import { invalidateHomeContent } from "@/lib/home-manager/invalidate";
export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) { try { await authorizeMutation(request); const kind = managedKindSchema.parse((await params).kind); const body = moveSchema.parse(await readJson(request)); await moveManaged(kind, body.id, body.direction, body.expectedUpdatedAt); invalidateHomeContent(); return Response.json({ reordered: true }); } catch (error) { return apiError(error); } }
