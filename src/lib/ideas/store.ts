import "server-only";
import { MongoServerError } from "mongodb";
import { getDatabase } from "../db/connection";
import { getCollection } from "../db/collections";
import { prepareCreate } from "../db/records";
import { transaction } from "../media/storage";
import { RequestError } from "../admin/http";
import { ideaInputSchema, type IdeaInput } from "./schema";

// Public submission entry point must validate Origin, token and rate budgets first.
export async function saveIdea(value: IdeaInput, ticket: { id: string; expiresAt: Date }) {
  const input = ideaInputSchema.parse(value);
  const record = prepareCreate("ideaSubmissions", { ...input, consentAt: new Date() });
  try {
    await transaction(async (session) => {
      const receipt = await (await getDatabase()).collection<{ _id: string; expiresAt: Date }>("contactReceipts").insertOne({ _id: ticket.id, expiresAt: ticket.expiresAt }, { session });
      if (!receipt.acknowledged) throw new Error("Receipt not acknowledged");
      const saved = await (await getCollection("ideaSubmissions")).insertOne(record, { session });
      if (!saved.acknowledged) throw new Error("Idea not acknowledged");
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) throw new RequestError("This form token was already used. Refresh form access before a new submission.", 409);
    throw error;
  }
}
