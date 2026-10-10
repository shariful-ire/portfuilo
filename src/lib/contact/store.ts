import "server-only";
import { MongoServerError } from "mongodb";
import { getDatabase } from "../db/connection";
import { getCollection } from "../db/collections";
import { prepareCreate } from "../db/records";
import { transaction } from "../media/storage";
import { RequestError } from "../admin/http";
import { contactMessageInput, type ContactMessageInput } from "./schema";
// Public submissions are the deliberate exception to admin-only content writes.
// Callers must enforce Origin, spam checks, signed token, and rate limits first.
export async function saveContactMessage(value: ContactMessageInput, ticket: { id: string; expiresAt: Date }) {
 const input = contactMessageInput.parse(value); const record = prepareCreate("contactMessages", { ...input, state: "unread" });
 try {
  await transaction(async (session) => {
   const receipt = await (await getDatabase()).collection<{ _id: string; expiresAt: Date }>("contactReceipts").insertOne({ _id: ticket.id, expiresAt: ticket.expiresAt }, { session });
   if (!receipt.acknowledged) throw new Error("Receipt not acknowledged");
   const result = await (await getCollection("contactMessages")).insertOne(record, { session });
   if (!result.acknowledged) throw new Error("Message not acknowledged");
  });
 } catch (error) { if (error instanceof MongoServerError && error.code === 11000) throw new RequestError("This form token was already used. If you submitted this message, do not submit it again.", 409); throw error; }
}
