import { z } from "zod";
import { webUrl } from "../content/sections";
export const certificateInputSchema = z.object({
  title: z.string().trim().min(1).max(200), issuer: z.string().trim().min(1).max(200),
  mediaId: z.uuid(), imageAlt: z.string().trim().min(1).max(500), pdfMediaId: z.union([z.literal(""), z.uuid()]).default(""),
  issuedOn: z.iso.date(), credentialId: z.string().trim().max(200).default(""),
  credentialUrl: z.union([z.literal(""), webUrl.refine((value) => { try { const url = new URL(value); return !url.username && !url.password; } catch { return false; } }, "URL must not contain credentials")]).default(""),
  description: z.string().trim().min(1).max(10_000), category: z.string().trim().min(1).max(100),
  displayOrder: z.number().int().min(0).max(1_000_000), status: z.enum(["draft", "published"]),
}).strict();
export type CertificateInput = z.infer<typeof certificateInputSchema>;
export const certificateUpdateSchema = z.object({ data: certificateInputSchema, expectedUpdatedAt: z.iso.datetime() }).strict();
export const certificateActionSchema = z.object({ status: z.enum(["draft", "published"]), expectedUpdatedAt: z.iso.datetime() }).strict();
export const certificateDeleteSchema = z.object({ expectedUpdatedAt: z.iso.datetime() }).strict();
export const certificateMoveSchema = z.object({ id: z.uuid(), direction: z.enum(["up", "down"]) }).strict();
export const emptyCertificate: CertificateInput = { title: "", issuer: "", mediaId: "", imageAlt: "", pdfMediaId: "", issuedOn: "", credentialId: "", credentialUrl: "", description: "", category: "", displayOrder: 0, status: "draft" };
export type CertificateView = { id: string; title: string; issuer: string; issuedOn?: string; credentialId?: string; credentialUrl?: string; description?: string; category?: string; imageAlt?: string; imageUrl?: string; pdfUrl?: string };
export type AdminCertificate = { id: string; updatedAt: string; data: CertificateInput };

export function moveCertificateIds(ids: string[], id: string, direction: "up" | "down") {
  const index = ids.indexOf(id);
  if (index < 0) throw new Error("Certificate not found.");
  const next = index + (direction === "up" ? -1 : 1);
  const result = [...ids];
  if (next >= 0 && next < result.length) [result[index], result[next]] = [result[next], result[index]];
  return result;
}
