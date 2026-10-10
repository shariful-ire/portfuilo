import { z } from "zod";
import { ideaCategories, ideaRecordSchema, reviewStates, type IdeaRecord } from "./schema";

const publicText = (max: number) => z.string().trim().max(max).refine((value) => !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value), "Keep email addresses out of public summaries");
export const ideaReviewSchema = z.object({
  expectedUpdatedAt: z.iso.datetime(), reviewStatus: z.enum(reviewStates), adminNotes: z.string().trim().max(10000),
  publicationState: z.enum(["draft", "published"]), approved: z.boolean(),
  summaryTitle: publicText(200), summaryBody: publicText(10000), contributor: publicText(200),
}).strict();
export type IdeaReview = z.infer<typeof ideaReviewSchema>;
export const ideaQuerySchema = z.object({ q: z.string().trim().max(100).default(""), page: z.coerce.number().int().min(1).max(1000).default(1), status: z.enum(["all", ...reviewStates]).default("all"), category: z.enum(["all", ...ideaCategories]).default("all"), publication: z.enum(["all", "draft", "published"]).default("all") });
export type IdeaQuery = z.infer<typeof ideaQuerySchema>;
export function ideaFilter(query: IdeaQuery) {
  const literal = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { ...(query.status !== "all" ? { reviewStatus: query.status } : {}), ...(query.category !== "all" ? { category: query.category } : {}), ...(query.publication !== "all" ? { publicationState: query.publication } : {}), ...(query.q ? { $or: ["title", "name", "email"].map((key) => ({ [key]: { $regex: literal, $options: "i" } })) } : {}) };
}
export function applyIdeaReview(record: IdeaRecord, value: unknown) {
  const input = ideaReviewSchema.parse(value);
  if (input.publicationState === "published" && (!record.publicationConsent || !input.approved || !input.summaryTitle || !input.summaryBody)) throw new Error("Publishing requires publication consent, an edited title and summary, and explicit approval.");
  if (input.contributor && !record.attributionConsent) throw new Error("Contributor attribution requires separate consent.");
  const { expectedUpdatedAt, ...changes } = input; void expectedUpdatedAt;
  return ideaRecordSchema.parse({ ...record, ...changes, updatedAt: new Date(Math.max(Date.now(), record.updatedAt.getTime() + 1)) });
}
const publicSchema = z.object({
  _id: z.uuid(), category: z.enum(ideaCategories), publicationConsent: z.literal(true), approved: z.literal(true), publicationState: z.literal("published"),
  summaryTitle: publicText(200).refine(Boolean), summaryBody: publicText(10000).refine(Boolean),
  attributionConsent: z.boolean(), contributor: publicText(200), updatedAt: z.date(),
});
export const publicIdeaProjection = Object.fromEntries(Object.keys(publicSchema.shape).map((key) => [key, 1]));
export function publicIdeaSummary(value: unknown) {
  const parsed = publicSchema.safeParse(value); if (!parsed.success) return null;
  const row = parsed.data;
  return { id: row._id, title: row.summaryTitle, body: row.summaryBody, category: row.category, contributor: row.attributionConsent ? row.contributor : "", updatedAt: row.updatedAt.toISOString() };
}
export type IdeaDetail = Omit<IdeaRecord, "_id" | "createdAt" | "updatedAt" | "consentAt"> & { id: string; createdAt: string; updatedAt: string; consentAt: string };
export type IdeaListItem = Pick<IdeaDetail, "id" | "title" | "name" | "email" | "category" | "reviewStatus" | "publicationState" | "createdAt" | "updatedAt">;
export type IdeaPage = { items: IdeaListItem[]; total: number; page: number; limit: number };
