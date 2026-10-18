import "server-only";
import type { IndexDescription } from "mongodb";
import type { CollectionName } from "../content/models";
import { getDatabase } from "./connection";

const publishedOrder: IndexDescription = { key: { status: 1, displayOrder: 1, _id: 1 }, name: "published_display_order" };
const uniqueSlug: IndexDescription = { key: { slug: 1 }, unique: true, name: "unique_slug" };
export const indexDefinitions: Record<CollectionName, IndexDescription[]> = {
  ideaSubmissions: [{ key: { reviewStatus: 1, createdAt: -1, _id: 1 }, name: "idea_review_date" }, { key: { publicationState: 1, approved: 1, publicationConsent: 1, updatedAt: -1 }, name: "idea_publication" }, { key: { createdAt: -1, _id: 1 }, name: "idea_inbox_date" }],
  profiles: [{ key: { key: 1 }, unique: true, name: "singleton_owner" }],
  siteSettings: [{ key: { key: 1 }, unique: true, name: "singleton_site" }],
  homepageSections: [publishedOrder],
  projects: [uniqueSlug, publishedOrder, { key: { status: 1, category: 1, displayOrder: 1, _id: 1 }, name: "project_category_order" }, { key: { status: 1, featured: 1, displayOrder: 1, _id: 1 }, name: "project_featured_order" }],
  certificates: [publishedOrder, { key: { status: 1, category: 1, displayOrder: 1, _id: 1 }, name: "certificate_category_order" }],
  posts: [uniqueSlug, publishedOrder, { key: { status: 1, publishedOn: -1, _id: 1 }, name: "post_publication_date" }, { key: { status: 1, tags: 1, publishedOn: -1, _id: 1 }, name: "post_tag_date" }],
  skills: [publishedOrder],
  timelineEntries: [publishedOrder, { key: { status: 1, kind: 1, displayOrder: 1, _id: 1 }, name: "timeline_kind" }],
  media: [publishedOrder, { key: { provider: 1, providerKey: 1 }, unique: true, name: "unique_provider_asset" }],
  contactMessages: [{ key: { state: 1, createdAt: -1 }, name: "inbox_state_date" }, { key: { createdAt: -1, _id: 1 }, name: "inbox_date_order" }],
};

// Explicit setup operation; never called by a public read or at build time.
export async function ensureDatabaseIndexes() {
  const db = await getDatabase();
  for (const [name, indexes] of Object.entries(indexDefinitions)) await db.collection(name).createIndexes(indexes);
  await db.collection("products").createIndexes([uniqueSlug, publishedOrder, { key: { status: 1, category: 1 }, name: "product_category" }]);
  await db.collection("productOrders").createIndexes([{key:{createdAt:-1,_id:1},name:"orders_date"},{key:{status:1,createdAt:-1},name:"orders_status"}]);
  await db.collection("productReviews").createIndexes([{key:{productId:1,status:1,createdAt:-1},name:"reviews_public"},{key:{status:1,createdAt:-1},name:"reviews_moderation"}]);
  await db.collection("mediaUploads").createIndexes([
    { key: { state: 1, createdAt: -1 }, name: "media_upload_state_date" },
    { key: { ownerId: 1, createdAt: -1 }, name: "media_upload_owner_date" },
  ]);
  await db.collection("contactRateLimits").createIndex({ expiresAt: 1 }, { name: "contact_rate_expiry", expireAfterSeconds: 0 });
  await db.collection("contactReceipts").createIndex({ expiresAt: 1 }, { name: "contact_receipt_expiry", expireAfterSeconds: 0 });
  await db.collection("visitReceipts").createIndex({expiresAt:1},{name:"visit_receipt_expiry",expireAfterSeconds:0});
  // No TTL: failed/pending records must survive for remote orphan cleanup.
}
