import "server-only";
import { requireAdmin } from "../auth/admin";
import { getDatabase } from "../db/connection";
import { managedCollections, type ManagedKind, type RelatedOptions } from "./schema";
import { toAdmin } from "./store";
export async function listManaged(kind: ManagedKind) {
 await requireAdmin();
 return (await (await getDatabase()).collection(managedCollections[kind]).find({}, { maxTimeMS: 5000 }).sort({ displayOrder: 1, _id: 1 }).toArray()).map((row) => toAdmin(kind, row));
}
export async function relatedOptions(): Promise<RelatedOptions> {
 await requireAdmin(); const db = await getDatabase();
 const pairs = await Promise.all((["projects", "certificates", "posts", "skills", "timeline"] as const).map(async (kind) => {
  const rows = await db.collection<{ _id: string; title?: string; name?: string; status: "draft" | "published" }>(kind === "timeline" ? "timelineEntries" : kind).find({}, { projection: { title: 1, name: 1, status: 1 }, maxTimeMS: 5000 }).sort({ title: 1, name: 1, _id: 1 }).toArray();
  return [kind, rows.map((row) => ({ id: row._id, label: row.title ?? row.name ?? "Untitled", status: row.status }))] as const;
 }));
 return Object.fromEntries(pairs) as RelatedOptions;
}
