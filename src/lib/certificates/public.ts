import "server-only";
import { z } from "zod";
import { getCollection } from "../db/collections";
import { parsePublicRecord, getPublishedMedia, DatabaseContentError } from "../db/public-read";
import { DatabaseConfigurationError, DatabaseUnavailableError } from "../db/connection";
import type { CertificateView } from "./schema";

const querySchema = z.object({ category: z.string().trim().max(100).default(""), page: z.number().int().min(1).max(1000).default(1), limit: z.number().int().min(1).max(24).default(12) });
export async function getPublicCertificates(options: { category?: string; page?: number; limit?: number } = {}) {
  const { category, page, limit } = querySchema.parse(options);
  try {
    const collection = await getCollection("certificates");
    const filter = { status: "published" as const, ...(category ? { category } : {}) };
    const [rows, total, names] = await Promise.all([
      collection.find(filter, { maxTimeMS: 5000 }).sort({ displayOrder: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
      collection.countDocuments(filter, { maxTimeMS: 5000 }),
      collection.distinct("category", { status: "published" }, { maxTimeMS: 5000 }),
    ]);
    const items = await Promise.all(rows.map(toPublicCertificateView));
    return { items, total, categories: names.filter((name): name is string => typeof name === "string" && !!name).sort(), page, limit };
  } catch (error) {
    if (error instanceof DatabaseConfigurationError || error instanceof DatabaseContentError || error instanceof DatabaseUnavailableError) throw error;
    throw new DatabaseUnavailableError();
  }
}

export async function toPublicCertificateView(row: import("../content/models").Certificate): Promise<CertificateView> {
      const record = parsePublicRecord("certificates", row);
      const [image, pdf] = await Promise.all([record.mediaId ? getPublishedMedia(record.mediaId) : null, record.pdfMediaId ? getPublishedMedia(record.pdfMediaId) : null]);
      return { id: record.id, title: record.title, issuer: record.issuer, issuedOn: record.issuedOn, credentialId: record.credentialId, credentialUrl: record.credentialUrl, description: record.description, category: record.category, imageAlt: record.imageAlt ?? image?.alt, imageUrl: image?.kind === "image" ? image.url : undefined, pdfUrl: pdf?.mimeType === "application/pdf" ? pdf.url : undefined };
}
