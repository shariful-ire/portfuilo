import "server-only";
import type { ClientSession } from "mongodb";
import { getDatabase } from "../db/connection";
import { getCollection } from "../db/collections";
import { prepareCreate } from "../db/records";
import { modelSchemas, type HomepageSection, type Skill, type TimelineEntry } from "../content/models";
import { transaction, lockReadyMedia } from "../media/storage";
import { RequestError } from "../admin/http";
import { managedCollections, managedInputSchema, sectionMediaIds, type ManagedInput, type ManagedKind, type AdminManaged } from "./schema";
type RecordType = HomepageSection | Skill | TimelineEntry;
async function collection(kind: ManagedKind) { return (await getDatabase()).collection<RecordType>(managedCollections[kind], { ignoreUndefined: true }); }
async function lock(kind: ManagedKind, session: ClientSession) { await (await getDatabase()).collection<{ _id: string; revision: number }>("contentLocks").updateOne({ _id: managedCollections[kind] }, { $inc: { revision: 1 } }, { upsert: true, session }); }
export function toAdmin(kind: ManagedKind, value: unknown): AdminManaged {
 const row = modelSchemas[managedCollections[kind]].parse(value);
 const base = { status: row.status, displayOrder: row.displayOrder };
 let input: ManagedInput;
 if ("section" in row) input = { kind: "sections", data: { ...base, title: row.title, subtitle: row.subtitle ?? "", section: row.section } };
 else if ("name" in row) input = { kind: "skills", data: { ...base, name: row.name, category: row.category ?? "", description: row.description ?? "" } };
 else input = { kind: "timeline", data: { ...base, kind: row.kind, title: row.title, organization: row.organization, description: row.description ?? "", startMonth: row.startMonth ?? "", endMonth: row.endMonth ?? "", current: row.current } };
 return { id: row._id, updatedAt: row.updatedAt.toISOString(), input };
}
function fields(input: ManagedInput) {
 if (input.kind === "sections") return { ...input.data, subtitle: input.data.subtitle || undefined };
 if (input.kind === "skills") return { ...input.data, category: input.data.category || undefined, description: input.data.description || undefined };
 return { ...input.data, description: input.data.description || undefined, startMonth: input.data.startMonth || undefined, endMonth: input.data.endMonth || undefined };
}
async function media(input: ManagedInput, session: ClientSession) {
 if (input.kind !== "sections") return;
 for (const id of sectionMediaIds(input.data.section)) {
  if (!await lockReadyMedia(id, session)) throw new RequestError("Select completed images that are not being deleted.", 409);
  const assets = await getCollection("media");
  if (!await assets.findOne({ _id: id, kind: "image" }, { session })) throw new RequestError("Section media must be images.");
  if (input.data.status === "published") await assets.updateOne({ _id: id }, { $set: { status: "published", updatedAt: new Date() } }, { session });
 }
}
async function existing(kind: ManagedKind, id: string, expected: string, session: ClientSession) {
 const row = await (await collection(kind)).findOne({ _id: id }, { session });
 if (!row) throw new RequestError("Record not found.", 404);
 const parsed = modelSchemas[managedCollections[kind]].parse(row);
 if (parsed.updatedAt.toISOString() !== expected) throw new RequestError("This record changed. Refresh the list before editing again.", 409);
 return parsed;
}
// Trusted stores: HTTP callers must use the shared requireAdmin mutation guard.
export async function createManaged(value: ManagedInput) {
 const input = managedInputSchema.parse(value);
 const record = prepareCreate(managedCollections[input.kind], fields(input));
 await transaction(async (session) => { await lock(input.kind, session); await media(input, session); await (await collection(input.kind)).insertOne(record, { session }); });
 return toAdmin(input.kind, record);
}
export async function updateManaged(id: string, value: ManagedInput, expected: string) {
 const input = managedInputSchema.parse(value);
 return transaction(async (session) => {
  await lock(input.kind, session); const old = await existing(input.kind, id, expected, session); await media(input, session);
  const record = modelSchemas[managedCollections[input.kind]].parse({ ...old, ...fields(input), updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) });
  await (await collection(input.kind)).replaceOne({ _id: id }, record, { session }); return toAdmin(input.kind, record);
 });
}
export async function setManagedStatus(kind: ManagedKind, id: string, status: "draft" | "published", expected: string) {
 return transaction(async (session) => {
  await lock(kind, session); const old = await existing(kind, id, expected, session);
  if (status === "published") { const input = managedInputSchema.parse({ kind, data: { ...toAdmin(kind, old).input.data, status } }); await media(input, session); }
  const record = { ...old, status, updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) };
  await (await collection(kind)).replaceOne({ _id: id }, record, { session }); return toAdmin(kind, record);
 });
}
export async function deleteManaged(kind: ManagedKind, id: string, expected: string) { await transaction(async (session) => { await lock(kind, session); await existing(kind, id, expected, session); await (await collection(kind)).deleteOne({ _id: id }, { session }); }); }
export async function moveManaged(kind: ManagedKind, id: string, direction: "up" | "down", expected: string) {
 await transaction(async (session) => {
  await lock(kind, session); await existing(kind, id, expected, session);
  const records = await collection(kind); const rows = await records.find({}, { session }).sort({ displayOrder: 1, _id: 1 }).toArray();
  const at = rows.findIndex((row) => row._id === id); const next = at + (direction === "up" ? -1 : 1);
  if (next < 0 || next >= rows.length) return;
  const originalPositions = new Map(rows.map((row, index) => [row._id, index]));
  [rows[at], rows[next]] = [rows[next], rows[at]];
  for (const [displayOrder, row] of rows.entries()) if (row.displayOrder !== displayOrder || originalPositions.get(row._id) !== displayOrder) await records.updateOne({ _id: row._id }, { $set: { displayOrder, updatedAt: new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1)) } }, { session });
 });
}
