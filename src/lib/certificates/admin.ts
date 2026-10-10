import "server-only";
import { requireAdmin } from "../auth/admin";
import { getCollection } from "../db/collections";
import { certificateToAdmin } from "./store";
export async function listAdminCertificates() {
  await requireAdmin();
  const rows = await (await getCollection("certificates")).find({}, { maxTimeMS: 5000 }).sort({ displayOrder: 1, _id: 1 }).toArray();
  return rows.map(certificateToAdmin);
}
