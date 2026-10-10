import "server-only";
import type { ClientSession } from "mongodb";
import { getDatabase } from "../db/connection";
import { getCollection } from "../db/collections";
import { prepareCreate } from "../db/records";
import { postSchema, type Post } from "../content/models";
import { transaction, lockReadyMedia } from "../media/storage";
import { RequestError } from "../admin/http";
import { postInputSchema, type PostInput, type AdminPost } from "./schema";

// Trusted server operations: each HTTP entry point authorizes via requireAdmin
// before invoking these routines, just like the existing settings writer.
async function lockCollection(session: ClientSession) {
  await (await getDatabase()).collection<{ _id: string; revision: number }>("contentLocks").updateOne({ _id: "posts" }, { $inc: { revision: 1 } }, { upsert: true, session });
}
export function postToAdmin(record: Post): AdminPost {
  const c = postSchema.parse(record);
  return { id: c._id, updatedAt: c.updatedAt.toISOString(), data: { title: c.title, slug: c.slug, excerpt: c.excerpt, markdown: c.markdown ?? c.body.map((block) => block.text).join("\n\n"), coverMediaId: c.coverMediaId ?? "", coverAlt: c.coverAlt ?? "", tags: c.tags, status: c.status, publishedOn: c.publishedOn ?? "", seoTitle: c.seoTitle ?? "", seoDescription: c.seoDescription ?? "" } };
}
async function checkMedia(input: PostInput, session: ClientSession) {
 const id = input.coverMediaId;
 if (!await lockReadyMedia(id, session)) throw new RequestError("Select a completed cover upload that is not being deleted.", 409);
 const media = await getCollection("media");
 if (!await media.findOne({ _id: id, kind: "image" }, { session })) throw new RequestError("Post cover must be an image.");
 if (input.status === "published") await media.updateOne({ _id: id }, { $set: { status: "published", updatedAt: new Date() } }, { session });
}
function fields(input: PostInput) { return { ...input, body: [], publishedOn: input.publishedOn || (input.status === "published" ? new Date().toISOString().slice(0, 10) : undefined), seoTitle: input.seoTitle || undefined, seoDescription: input.seoDescription || undefined }; }

async function checkSlug(slug: string, session: ClientSession, id?: string) {
  const found = await (await getCollection("posts")).findOne({ slug }, { session });
  if (found && found._id !== id) throw new RequestError("This slug is already used. Choose a unique slug.", 409);
}
async function existing(id: string, expected: string, session: ClientSession) {
  const record = await (await getCollection("posts")).findOne({ _id: id }, { session });
  if (!record) throw new RequestError("Post not found.", 404);
  const parsed = postSchema.parse(record);
  if (parsed.updatedAt.toISOString() !== expected) throw new RequestError("This post changed in another request. Reload the list before editing it again.", 409);
  return parsed;
}
export async function createPost(input: PostInput) {
  const data = postInputSchema.parse(input);
  const record = prepareCreate("posts", fields(data));
  await transaction(async (session) => { await lockCollection(session); await checkSlug(data.slug, session); await checkMedia(data, session); await (await getCollection("posts")).insertOne(record, { session }); });
  return postToAdmin(record);
}
export async function updatePost(id: string, input: PostInput | { status: "draft" | "published" }, expected: string) {
  return transaction(async (session) => {
    await lockCollection(session);
    const old = await existing(id, expected, session);
    // Revoking publication must remain possible even for legacy/incomplete
    // records or media that has become unavailable outside this application.
    if (!("title" in input) && input.status === "draft") {
      const record = { ...old, status: "draft" as const, updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) };
      await (await getCollection("posts")).replaceOne({ _id: id }, record, { session });
      return postToAdmin(record);
    }
    const data = postInputSchema.parse("title" in input ? input : { ...postToAdmin(old).data, status: input.status });
    await checkSlug(data.slug, session, id);
    await checkMedia(data, session);
    const record = postSchema.parse({ ...old, ...fields(data), updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) });
    await (await getCollection("posts")).replaceOne({ _id: id }, record, { session });
    return postToAdmin(record);
  });
}
export async function deletePost(id: string, expected: string) {
  await transaction(async (session) => { await lockCollection(session); await existing(id, expected, session); await (await getCollection("posts")).deleteOne({ _id: id }, { session }); });
  // Media is intentionally retained; the existing deletion route checks all references.
}
