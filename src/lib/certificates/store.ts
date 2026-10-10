import "server-only";
import type { ClientSession } from "mongodb";
import { getDatabase } from "../db/connection";
import { getCollection } from "../db/collections";
import { prepareCreate } from "../db/records";
import { certificateSchema, type Certificate } from "../content/models";
import { transaction, lockReadyMedia } from "../media/storage";
import { RequestError } from "../admin/http";
import { certificateInputSchema, moveCertificateIds, type CertificateInput, type AdminCertificate } from "./schema";

// Trusted server operations: each HTTP entry point authorizes via requireAdmin
// before invoking these routines, just like the existing settings writer.
async function lockCollection(session: ClientSession) {
  await (await getDatabase()).collection<{ _id: string; revision: number }>("contentLocks").updateOne({ _id: "certificates" }, { $inc: { revision: 1 } }, { upsert: true, session });
}
export function certificateToAdmin(record: Certificate): AdminCertificate {
  const c = certificateSchema.parse(record);
  return { id: c._id, updatedAt: c.updatedAt.toISOString(), data: { title: c.title, issuer: c.issuer, issuedOn: c.issuedOn ?? "", mediaId: c.mediaId ?? "", imageAlt: c.imageAlt ?? "", pdfMediaId: c.pdfMediaId ?? "", credentialId: c.credentialId ?? "", credentialUrl: c.credentialUrl ?? "", description: c.description ?? "", category: c.category ?? "", displayOrder: c.displayOrder, status: c.status } };
}
async function checkMedia(input: CertificateInput, session: ClientSession) {
  for (const [id, kind] of [[input.mediaId, "image"], [input.pdfMediaId, "document"]] as const) {
    if (!id) continue;
    if (!await lockReadyMedia(id, session)) throw new RequestError("Select a completed upload that is not being deleted.", 409);
    const media = await getCollection("media");
    const asset = await media.findOne({ _id: id, kind }, { session });
    if (!asset || (kind === "document" && asset.mimeType !== "application/pdf")) throw new RequestError("Certificate image must be an image; the optional document must be a PDF.");
    if (input.status === "published") await media.updateOne({ _id: id }, { $set: { status: "published", updatedAt: new Date() } }, { session });
  }
}
function fields(input: CertificateInput) { return { ...input, pdfMediaId: input.pdfMediaId || undefined, credentialId: input.credentialId || undefined, credentialUrl: input.credentialUrl || undefined }; }
async function existing(id: string, expected: string, session: ClientSession) {
  const record = await (await getCollection("certificates")).findOne({ _id: id }, { session });
  if (!record) throw new RequestError("Certificate not found.", 404);
  const parsed = certificateSchema.parse(record);
  if (parsed.updatedAt.toISOString() !== expected) throw new RequestError("This certificate changed in another request. Reload the list before editing it again.", 409);
  return parsed;
}
export async function createCertificate(input: CertificateInput) {
  const data = certificateInputSchema.parse(input);
  const record = prepareCreate("certificates", fields(data));
  await transaction(async (session) => { await lockCollection(session); await checkMedia(data, session); await (await getCollection("certificates")).insertOne(record, { session }); });
  return certificateToAdmin(record);
}
export async function updateCertificate(id: string, input: CertificateInput | { status: "draft" | "published" }, expected: string) {
  return transaction(async (session) => {
    await lockCollection(session);
    const old = await existing(id, expected, session);
    // Revoking publication must remain possible even for legacy/incomplete
    // records or media that has become unavailable outside this application.
    if (!("title" in input) && input.status === "draft") {
      const record = { ...old, status: "draft" as const, updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) };
      await (await getCollection("certificates")).replaceOne({ _id: id }, record, { session });
      return certificateToAdmin(record);
    }
    const data = certificateInputSchema.parse("title" in input ? input : { ...certificateToAdmin(old).data, status: input.status });
    await checkMedia(data, session);
    const record = certificateSchema.parse({ ...old, ...fields(data), updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) });
    await (await getCollection("certificates")).replaceOne({ _id: id }, record, { session });
    return certificateToAdmin(record);
  });
}
export async function deleteCertificate(id: string, expected: string) {
  await transaction(async (session) => { await lockCollection(session); await existing(id, expected, session); await (await getCollection("certificates")).deleteOne({ _id: id }, { session }); });
  // Media is intentionally retained; the existing deletion route checks all references.
}
export async function reorderCertificate(id: string, direction: "up" | "down") {
  await transaction(async (session) => {
    await lockCollection(session);
    const collection = await getCollection("certificates");
    const rows = await collection.find({}, { session }).sort({ displayOrder: 1, _id: 1 }).toArray();
    if (!rows.some((row) => row._id === id)) throw new RequestError("Certificate not found.", 404);
    const ids = moveCertificateIds(rows.map((row) => row._id), id, direction);
    for (const [order, key] of ids.entries()) {
      const old = rows.find((row) => row._id === key)!;
      if (old.displayOrder !== order) await collection.updateOne({ _id: key }, { $set: { displayOrder: order, updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) } }, { session });
    }
  });
}
