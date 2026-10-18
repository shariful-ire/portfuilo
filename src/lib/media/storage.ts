import "server-only";
import type { ClientSession, Filter, Document } from "mongodb";
import type { UploadInput } from "./policy";
import { getDatabase, getMongoClient } from "../db/connection";

export type UploadRecord = {
  _id: string; ownerId: string; input: UploadInput; signature: string; timestamp: number;
  state: "pending" | "uploading" | "ready" | "failed" | "deleting" | "deleted";
  createdAt: Date; updatedAt: Date; expiresAt: Date; revision: number;
};
export async function uploads() { return (await getDatabase()).collection<UploadRecord>("mediaUploads"); }
export async function transaction<T>(work: (session: ClientSession) => Promise<T>) {
  const client = await getMongoClient();
  const session = client.startSession();
  try { return await session.withTransaction(() => work(session)); }
  finally { await session.endSession(); }
}
// All future reference writers must lock this same upload record in their
// transaction. This prevents a settings save racing deletion of its media.
export async function lockReadyMedia(id: string, session: ClientSession) {
  const result = await (await uploads()).updateOne({ _id: id, state: "ready" }, { $inc: { revision: 1 } }, { session });
  return result.matchedCount === 1;
}
export async function isReferenced(id: string, session: ClientSession) {
  const db = await getDatabase();
  const queries: [string, Filter<Document>][] = [
    ["products", { $or: [{ "images.mediaId": id }, { videoId: id }] }],
    ["profiles", { $or: [{ photoMediaId: id }, { cvMediaId: id }] }],
    ["siteSettings", { $or: [{ sharingMediaId: id }, { "presentation.logoId": id }, { "presentation.lightLogoId": id }, { "presentation.darkLogoId": id }, { "presentation.faviconId": id }] }],
    ["projects", { $or: [{ mediaIds: id }, { thumbnailId: id }, { "gallery.mediaId": id }] }], ["certificates", { $or: [{ mediaId: id }, { pdfMediaId: id }] }], ["posts", { coverMediaId: id }],
    ["homepageSections", { $or: [{ "section.content.mediaId": id }, { "section.content.items.mediaId": id }] }],
  ];
  // MongoDB does not support parallel operations within a transaction.
  for (const [name, filter] of queries) if (await db.collection(name).findOne(filter, { session, projection: { _id: 1 } })) return true;
  return false;
}
