import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { reorderCertificate } from "@/lib/certificates/store";
import { certificateMoveSchema } from "@/lib/certificates/schema";
import { invalidateCertificates } from "@/lib/certificates/invalidate";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { await authorizeMutation(request); const body = certificateMoveSchema.parse(await readJson(request)); await reorderCertificate(body.id, body.direction); invalidateCertificates(); return Response.json({ reordered: true }); } catch (error) { return apiError(error); }
}
