import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { managedKindSchema, managedInputSchema } from "@/lib/home-manager/schema";
import { resolveSection } from "@/lib/home-manager/public";
import type { ResolvedSection } from "@/lib/home-manager/view-types";
export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
 try {
  await authorizeMutation(request); const kind = managedKindSchema.parse((await params).kind); const input = managedInputSchema.parse({ kind, data: await readJson(request, 512000) });
  const result: ResolvedSection = input.kind === "sections" ? await resolveSection(input.data, "preview", true) : input.kind === "skills" ? { id: "preview", title: "Skill preview", content: { type: "skills", items: [{ id: "preview", ...input.data }] } } : { id: "preview", title: "Timeline preview", content: { type: "timeline", items: [{ id: "preview", ...input.data }] } };
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
 } catch (error) { return apiError(error); }
}
