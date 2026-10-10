import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authorizeMutation, readBytes, apiError, RequestError } from "@/lib/admin/http";
import { validateFile } from "@/lib/media/policy";
import { uploadToCloudinary, uploadParameters, destroyCloudinary, cloudinaryServer } from "@/lib/media/cloudinary";
import { uploads, transaction, isReferenced } from "@/lib/media/storage";
import { getCollection } from "@/lib/db/collections";
import { mediaSchema } from "@/lib/content/models";
import { verifyUploadTicket } from "@/lib/media/ticket";

export const runtime = "nodejs";
export const maxDuration = 120;
type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  let claimedId: string | undefined;
  try {
    const admin = await authorizeMutation(request);
    cloudinaryServer();
    const id = z.uuid().parse((await context.params).id);
    const store = await uploads();
    const candidate = await store.findOne({ _id: id, ownerId: admin.id, state: "pending", expiresAt: { $gt: new Date() } });
    const signature = request.headers.get("x-upload-signature") ?? "";
    const intent = verifyUploadTicket(candidate, admin.id, signature);
    if (request.headers.get("content-type") !== intent.input.mime) throw new RequestError("Unexpected file type.", 415);
    const bytes = await readBytes(request, intent.input.size);
    try { validateFile(bytes, intent.input); } catch { throw new RequestError("File contents, type, or size do not match. Only JPEG, PNG, WebP, and PDF are supported.", 415); }
    const claim = await store.updateOne({ _id: id, state: "pending", expiresAt: { $gt: new Date() } }, { $set: { state: "uploading", updatedAt: new Date() } });
    if (!claim.modifiedCount) throw new RequestError("Upload authorization has expired or was already used.", 409);
    claimedId = id;
    const result = await uploadToCloudinary(bytes, uploadParameters(id, intent.input.mime, intent.timestamp));
    const allowed = { "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"], "application/pdf": ["pdf"] };
    const { env } = cloudinaryServer();
    const url = new URL(result.secure_url);
    if (result.public_id !== `portfolio/${id}` || result.resource_type !== "image" || !allowed[intent.input.mime].includes(result.format) || result.bytes > intent.input.size || url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || !url.pathname.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/`)) throw new RequestError("Cloudinary returned unexpected media metadata. Delete this failed upload before retrying.", 502);
    const now = new Date();
    const media = mediaSchema.parse({ _id: id, createdAt: now, updatedAt: now, status: "draft", displayOrder: 0, provider: "cloudinary", providerKey: result.public_id, url: result.secure_url, kind: intent.input.mime === "application/pdf" ? "document" : "image", mimeType: intent.input.mime, bytes: result.bytes, width: result.width || undefined, height: result.height || undefined, alt: intent.input.alt, originalFilename: intent.input.name });
    await transaction(async (session) => {
      const commit = await store.updateOne({ _id: id, state: "uploading" }, { $set: { state: "ready", updatedAt: now } }, { session });
      if (!commit.modifiedCount) throw new RequestError("Upload state changed. Refresh the media list.", 409);
      await (await getCollection("media")).insertOne(media, { session });
    });
    revalidatePath("/dashboard/settings");
    return Response.json({ id, url: media.url, kind: media.kind, name: intent.input.name, alt: media.alt, state: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (claimedId) {
      try { await (await uploads()).updateOne({ _id: claimedId, state: "uploading" }, { $set: { state: "failed", updatedAt: new Date() } }); }
      catch { /* Keep the original failure; a stale uploading record remains recoverable. */ }
    }
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    await authorizeMutation(request);
    cloudinaryServer();
    const id = z.uuid().parse((await context.params).id);
    const store = await uploads();
    await transaction(async (session) => {
      const record = await store.findOne({ _id: id }, { session });
      if (!record) throw new RequestError("Media upload record not found. Unmanaged assets cannot be deleted here.", 404);
      if (["uploading", "failed"].includes(record.state) && Date.now() - record.updatedAt.getTime() < 10 * 60_000) throw new RequestError("The remote upload may still be processing. Wait 10 minutes before cleanup.", 409);
      if (await isReferenced(id, session)) throw new RequestError("This asset is referenced by saved content. Remove or replace those references and save before deleting.", 409);
      await store.updateOne({ _id: id }, { $set: { state: "deleting", updatedAt: new Date() }, $inc: { revision: 1 } }, { session });
      await (await getCollection("media")).updateOne({ _id: id }, { $set: { status: "draft", updatedAt: new Date() } }, { session });
    });
    // Fixed server-owned public ID, never a client URL or arbitrary provider key.
    await destroyCloudinary(`portfolio/${id}`);
    await transaction(async (session) => {
      await (await getCollection("media")).deleteOne({ _id: id }, { session });
      await store.updateOne({ _id: id, state: "deleting" }, { $set: { state: "deleted", updatedAt: new Date() } }, { session });
    });
    revalidatePath("/", "layout");
    return Response.json({ deleted: true });
  } catch (error) { return apiError(error); }
}
