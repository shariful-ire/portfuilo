import { z } from "zod";
import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { updateCertificate, deleteCertificate } from "@/lib/certificates/store";
import {
  certificateUpdateSchema,
  certificateActionSchema,
  certificateDeleteSchema,
} from "@/lib/certificates/schema";
import { invalidateCertificates } from "@/lib/certificates/invalidate";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try {
    await authorizeMutation(request);
    const id = z.uuid().parse((await context.params).id);
    const body = certificateUpdateSchema.parse(await readJson(request));
    const record = await updateCertificate(
      id,
      body.data,
      body.expectedUpdatedAt,
    );
    invalidateCertificates();
    return Response.json(record);
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    await authorizeMutation(request);
    const id = z.uuid().parse((await context.params).id);
    const body = certificateActionSchema.parse(await readJson(request));
    const record = await updateCertificate(
      id,
      { status: body.status },
      body.expectedUpdatedAt,
    );
    invalidateCertificates();
    return Response.json(record);
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await authorizeMutation(request);
    const id = z.uuid().parse((await context.params).id);
    const body = certificateDeleteSchema.parse(await readJson(request));
    await deleteCertificate(id, body.expectedUpdatedAt);
    invalidateCertificates();
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
