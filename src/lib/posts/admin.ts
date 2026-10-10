import "server-only";
import { requireAdmin } from "../auth/admin";
import { getCollection } from "../db/collections";
import { postToAdmin } from "./store";
export async function listAdminPosts() {
  await requireAdmin();
  const rows = await (await getCollection("posts")).find({}, { maxTimeMS: 5000 }).sort({ updatedAt: -1, _id: 1 }).toArray();
  return rows.map(postToAdmin);
}
