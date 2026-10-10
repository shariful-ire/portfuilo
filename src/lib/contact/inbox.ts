import "server-only";
import { requireAdmin } from "../auth/admin";
import { getCollection } from "../db/collections";
import { contactMessageSchema } from "../content/models";
import { RequestError } from "../admin/http";
import { inboxFilter, inboxQuerySchema, type InboxItem, type InboxMessage } from "./schema";
function view(value: unknown): InboxMessage { const row = contactMessageSchema.parse(value); return { preview: row.message.slice(0, 180), id: row._id, name: row.name, email: row.email, subject: row.subject, message: row.message, state: row.state, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }; }
export async function listInbox(options: { page?: number; state?: string; q?: string } = {}) {
 await requireAdmin(); const query = inboxQuerySchema.parse(options); const { page } = query; const limit = 20;
 const collection = await getCollection("contactMessages"); const filter = inboxFilter(query);
 const [rows, total] = await Promise.all([collection.find(filter, { maxTimeMS: 5000 }).sort({ createdAt: -1, _id: 1 }).skip((page - 1) * limit).limit(limit).toArray(), collection.countDocuments(filter, { maxTimeMS: 5000 })]);
 const items: InboxItem[] = rows.map((row) => { const { message, ...item } = view(row); void message; return item; }); return { items, total, page, limit };
}
export async function readInboxMessage(id: string) { await requireAdmin(); const row = await (await getCollection("contactMessages")).findOne({ _id: id }, { maxTimeMS: 5000 }); if (!row) throw new RequestError("Message not found.", 404); return view(row); }
// HTTP mutations call requireAdmin through authorizeMutation before these stores.
export async function markInboxMessage(id: string, state: "read" | "unread", expected: string) {
 const updatedAt = new Date(Math.max(Date.now(), new Date(expected).getTime() + 1));
 const result = await (await getCollection("contactMessages")).updateOne({ _id: id, updatedAt: new Date(expected) }, { $set: { state, updatedAt } });
 if (!result.acknowledged) throw new Error("Message update not acknowledged");
 if (!result.matchedCount) throw new RequestError("This message changed or was deleted. Refresh the inbox.", 409);
}
export async function deleteInboxMessage(id: string, expected: string) {
 const result = await (await getCollection("contactMessages")).deleteOne({ _id: id, updatedAt: new Date(expected) });
 if (!result.acknowledged) throw new Error("Message deletion not acknowledged");
 if (!result.deletedCount) throw new RequestError("This message changed or was deleted. Refresh the inbox.", 409);
}

export async function countUnreadMessages() { await requireAdmin(); return (await getCollection("contactMessages")).countDocuments({ state: "unread" }, { maxTimeMS: 5000 }); }
