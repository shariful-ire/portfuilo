import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { listAdminPosts } from "@/lib/posts/admin";
import { createPost } from "@/lib/posts/store";
import { postInputSchema } from "@/lib/posts/schema";
import { invalidatePosts } from "@/lib/posts/invalidate";
export const runtime = "nodejs";
export async function GET() { try { return Response.json(await listAdminPosts(), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) {
  try { await authorizeMutation(request); const record = await createPost(postInputSchema.parse(await readJson(request, 512_000))); invalidatePosts(); return Response.json(record, { status: 201, headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}
