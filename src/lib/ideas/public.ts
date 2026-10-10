import "server-only";
import { getCollection } from "../db/collections";
import { publicIdeaProjection, publicIdeaSummary } from "./review-schema";

export async function getPublicIdeas() {
  const rows = await (await getCollection("ideaSubmissions")).find({ publicationState: "published", approved: true, publicationConsent: true }, { projection: publicIdeaProjection, maxTimeMS: 5000 }).sort({ updatedAt: -1, _id: 1 }).limit(24).toArray();
  return rows.map(publicIdeaSummary).filter((row) => row !== null);
}
