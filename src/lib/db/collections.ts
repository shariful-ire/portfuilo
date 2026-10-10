import "server-only";
import type { Collection } from "mongodb";
import type { CollectionName, Models } from "../content/models";
import { getDatabase } from "./connection";

// Trusted server access only. Public callers must use public-read.ts.
export async function getCollection<K extends CollectionName>(name: K): Promise<Collection<Models[K]>> {
  // Optional Zod fields use undefined, not null. Preserve that contract across
  // real BSON writes, including replacement documents that clear old fields.
  return (await getDatabase()).collection<Models[K]>(name, { ignoreUndefined: true });
}
