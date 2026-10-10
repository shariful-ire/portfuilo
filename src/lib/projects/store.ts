import "server-only";
import type { ClientSession } from "mongodb";
import { getDatabase } from "../db/connection";
import { getCollection } from "../db/collections";
import { prepareCreate } from "../db/records";
import { projectSchema, type Project } from "../content/models";
import { transaction, lockReadyMedia } from "../media/storage";
import { RequestError } from "../admin/http";
import { projectInputSchema, type ProjectInput, type AdminProject } from "./schema";

// Trusted server operations: each HTTP entry point authorizes via requireAdmin
// before invoking these routines, just like the existing settings writer.
async function lockCollection(session: ClientSession) {
  await (await getDatabase()).collection<{ _id: string; revision: number }>("contentLocks").updateOne({ _id: "projects" }, { $inc: { revision: 1 } }, { upsert: true, session });
}
export function projectToAdmin(record: Project): AdminProject {
  const c = projectSchema.parse(record);
  return { id: c._id, updatedAt: c.updatedAt.toISOString(), data: { title: c.title, slug: c.slug, summary: c.summary, description: c.description ?? c.body.map((block) => block.text).join("\n\n"), problem: c.problem ?? "", solution: c.solution ?? "", contribution: c.contribution ?? "", features: c.features, technologies: c.technologies, thumbnailId: c.thumbnailId ?? "", thumbnailAlt: c.thumbnailAlt ?? "", gallery: c.gallery, category: c.category, repositoryUrl: c.repositoryUrl ?? "", liveUrl: c.liveUrl ?? "", videoUrl: c.videoUrl ?? "", challenges: c.challenges ?? "", lessons: c.lessons ?? "", featured: c.featured, displayOrder: c.displayOrder, status: c.status } };
}
async function checkMedia(input: ProjectInput, session: ClientSession) {
  for (const id of new Set([input.thumbnailId, ...input.gallery.map((item) => item.mediaId)])) {
    if (!await lockReadyMedia(id, session)) throw new RequestError("Select a completed image upload that is not being deleted.", 409);
    const media = await getCollection("media");
    if (!await media.findOne({ _id: id, kind: "image" }, { session })) throw new RequestError("Project media must be images.");
    if (input.status === "published") await media.updateOne({ _id: id }, { $set: { status: "published", updatedAt: new Date() } }, { session });
  }
}
function fields(input: ProjectInput) { return { ...input, body: [], mediaIds: [...new Set([input.thumbnailId, ...input.gallery.map((item) => item.mediaId)])], repositoryUrl: input.repositoryUrl || undefined, liveUrl: input.liveUrl || undefined, videoUrl: input.videoUrl || undefined, challenges: input.challenges || undefined, lessons: input.lessons || undefined }; }
async function checkSlug(slug: string, session: ClientSession, id?: string) {
  const found = await (await getCollection("projects")).findOne({ slug }, { session });
  if (found && found._id !== id) throw new RequestError("This slug is already used. Choose a unique slug.", 409);
}
async function existing(id: string, expected: string, session: ClientSession) {
  const record = await (await getCollection("projects")).findOne({ _id: id }, { session });
  if (!record) throw new RequestError("Project not found.", 404);
  const parsed = projectSchema.parse(record);
  if (parsed.updatedAt.toISOString() !== expected) throw new RequestError("This project changed in another request. Reload the list before editing it again.", 409);
  return parsed;
}
export async function createProject(input: ProjectInput) {
  const data = projectInputSchema.parse(input);
  const record = prepareCreate("projects", fields(data));
  await transaction(async (session) => { await lockCollection(session); await checkSlug(data.slug, session); await checkMedia(data, session); await (await getCollection("projects")).insertOne(record, { session }); });
  return projectToAdmin(record);
}
export async function updateProject(id: string, input: ProjectInput | { status: "draft" | "published" }, expected: string) {
  return transaction(async (session) => {
    await lockCollection(session);
    const old = await existing(id, expected, session);
    // Revoking publication must remain possible even for legacy/incomplete
    // records or media that has become unavailable outside this application.
    if (!("title" in input) && input.status === "draft") {
      const record = { ...old, status: "draft" as const, updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) };
      await (await getCollection("projects")).replaceOne({ _id: id }, record, { session });
      return projectToAdmin(record);
    }
    const data = projectInputSchema.parse("title" in input ? input : { ...projectToAdmin(old).data, status: input.status });
    await checkSlug(data.slug, session, id);
    await checkMedia(data, session);
    const record = projectSchema.parse({ ...old, ...fields(data), updatedAt: new Date(Math.max(Date.now(), old.updatedAt.getTime() + 1)) });
    await (await getCollection("projects")).replaceOne({ _id: id }, record, { session });
    return projectToAdmin(record);
  });
}
export async function deleteProject(id: string, expected: string) {
  await transaction(async (session) => { await lockCollection(session); await existing(id, expected, session); await (await getCollection("projects")).deleteOne({ _id: id }, { session }); });
  // Media is intentionally retained; the existing deletion route checks all references.
}
