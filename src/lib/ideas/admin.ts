import "server-only";
import { z } from "zod";
import { requireAdmin } from "../auth/admin";
import { getCollection } from "../db/collections";
import { RequestError } from "../admin/http";
import { ideaRecordSchema } from "./schema";
import { applyIdeaReview, ideaFilter, ideaQuerySchema, ideaReviewSchema, type IdeaDetail, type IdeaPage } from "./review-schema";

export async function listIdeas(options: unknown = {}): Promise<IdeaPage> {
  await requireAdmin(); const query = ideaQuerySchema.parse(options); const collection = await getCollection("ideaSubmissions"); const filter = ideaFilter(query); const limit = 20;
  const [rows, total] = await Promise.all([collection.find(filter, { maxTimeMS: 5000 }).sort({ createdAt: -1, _id: 1 }).skip((query.page - 1) * limit).limit(limit).toArray(), collection.countDocuments(filter, { maxTimeMS: 5000 })]);
  return { items: rows.map((value) => { const row = ideaRecordSchema.parse(value); return { id: row._id, title: row.title, name: row.name, email: row.email, category: row.category, reviewStatus: row.reviewStatus, publicationState: row.publicationState, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }; }), total, page: query.page, limit };
}
export async function readIdea(id: string): Promise<IdeaDetail> {
  await requireAdmin(); const row = await (await getCollection("ideaSubmissions")).findOne({ _id: z.uuid().parse(id) }, { maxTimeMS: 5000 });
  if (!row) throw new RequestError("Idea not found.", 404);
  const { _id, createdAt, updatedAt, consentAt, ...fields } = ideaRecordSchema.parse(row);
  return { ...fields, id: _id, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString(), consentAt: consentAt.toISOString() };
}
export async function updateIdea(id: string, value: unknown) {
  await requireAdmin(); const input = ideaReviewSchema.parse(value); const collection = await getCollection("ideaSubmissions");
  const row = await collection.findOne({ _id: z.uuid().parse(id) }); if (!row) throw new RequestError("Idea not found.", 404);
  const current = ideaRecordSchema.parse(row);
  if (current.updatedAt.toISOString() !== input.expectedUpdatedAt) throw new RequestError("This idea changed. Reload before saving.", 409);
  let next; try { next = applyIdeaReview(current, input); } catch (error) { throw new RequestError(error instanceof Error ? error.message : "Review could not be saved."); }
  const result = await collection.replaceOne({ _id: current._id, updatedAt: current.updatedAt }, next);
  if (!result.acknowledged) throw new Error("Review not acknowledged");
  if (!result.matchedCount) throw new RequestError("This idea changed. Reload before saving.", 409);
}
export async function deleteIdea(id: string, expected: string) {
  await requireAdmin(); z.iso.datetime().parse(expected);
  const result = await (await getCollection("ideaSubmissions")).deleteOne({ _id: z.uuid().parse(id), updatedAt: new Date(expected) });
  if (!result.acknowledged) throw new Error("Deletion not acknowledged");
  if (!result.deletedCount) throw new RequestError("This idea changed. Reload before deleting.", 409);
}
