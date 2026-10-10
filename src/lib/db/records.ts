import "server-only";
import { randomUUID } from "node:crypto";
import { modelSchemas, type CollectionName, type Models } from "../content/models";

// Pure preparation, not persistence. Future authorized writes must use these
// validators and then explicitly await a database write result.
// Call await requireAdmin() in each future mutation/upload entry point before
// accessing private records or causing side effects; these helpers do not authorize.
export function prepareCreate<K extends CollectionName>(name: K, input: unknown): Models[K] {
  const now = new Date();
  const data = typeof input === "object" && input !== null ? input : {};
  return modelSchemas[name].parse({ ...data, _id: randomUUID(), createdAt: now, updatedAt: now }) as Models[K];
}
export function prepareUpdate<K extends CollectionName>(name: K, existing: Models[K], input: unknown): Models[K] {
  const data = typeof input === "object" && input !== null ? input : {};
  return modelSchemas[name].parse({ ...existing, ...data, _id: existing._id, createdAt: existing.createdAt, updatedAt: new Date() }) as Models[K];
}
