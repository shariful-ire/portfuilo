import "server-only";
import { requireAdmin } from "../auth/admin";
import { getCollection } from "../db/collections";
import { projectToAdmin } from "./store";
export async function listAdminProjects() {
  await requireAdmin();
  const rows = await (await getCollection("projects")).find({}, { maxTimeMS: 5000 }).sort({ displayOrder: 1, _id: 1 }).toArray();
  return rows.map(projectToAdmin);
}
