import { z } from "zod";
import { contactMessageInput } from "../contact/schema";

export const ideaCategories = ["Web Development", "IoT", "Robotics", "Research", "Other"] as const;
const text = (min: number, max: number) => z.string().trim().min(min).max(max).refine((s) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s), "Unsupported control characters");
const reference = z.union([z.literal(""), z.url().max(2000).refine((s) => { const u = new URL(s); return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password; }, "Use an HTTP or HTTPS reference URL")]);
export const ideaInputSchema = contactMessageInput.pick({ name: true, email: true }).extend({
  organization: text(0, 200).default(""), title: text(1, 200), category: z.enum(ideaCategories),
  description: text(20, 10000), problem: text(10, 5000), collaboration: text(10, 5000),
  referenceUrl: reference.default(""), timeline: text(0, 300).default(""),
  storageConsent: z.literal(true, { error: "Consent to store your submission and contact you is required" }),
  publicationConsent: z.boolean().default(false), attributionConsent: z.boolean().default(false),
}).strict();
export const ideaSubmissionSchema = ideaInputSchema.extend({ token: z.string().min(1).max(200), website: z.string().max(200).default("") }).strict();
export const reviewStates = ["new", "reviewing", "interested", "archived"] as const;
export const ideaRecordSchema = ideaInputSchema.extend({
  _id: z.uuid(), createdAt: z.date(), updatedAt: z.date(), consentAt: z.date(),
  reviewStatus: z.enum(reviewStates).default("new"), adminNotes: text(0, 10000).default(""),
  publicationState: z.enum(["draft", "published"]).default("draft"), approved: z.boolean().default(false),
  summaryTitle: text(0, 200).default(""), summaryBody: text(0, 10000).default(""), contributor: text(0, 200).default(""),
});
export type IdeaInput = z.infer<typeof ideaInputSchema>;
export type IdeaRecord = z.infer<typeof ideaRecordSchema>;
