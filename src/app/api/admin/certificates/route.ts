import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { listAdminCertificates } from "@/lib/certificates/admin";
import { createCertificate } from "@/lib/certificates/store";
import { certificateInputSchema } from "@/lib/certificates/schema";
import { invalidateCertificates } from "@/lib/certificates/invalidate";
export const runtime = "nodejs";
export async function GET() { try { return Response.json(await listAdminCertificates(), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) {
  try { await authorizeMutation(request); const record = await createCertificate(certificateInputSchema.parse(await readJson(request))); invalidateCertificates(); return Response.json(record, { status: 201, headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}
