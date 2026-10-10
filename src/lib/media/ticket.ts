import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { UploadRecord } from "./storage";
import { RequestError } from "../admin/http";
export function verifyUploadTicket(record: UploadRecord | null, ownerId: string, signature: string, now = new Date()) {
  if (!record || record.ownerId !== ownerId || record.state !== "pending" || record.expiresAt <= now || !/^[a-f0-9]{64}$/.test(signature) || record.signature.length !== signature.length || !timingSafeEqual(Buffer.from(record.signature), Buffer.from(signature))) throw new RequestError("Upload authorization is invalid, expired, or already used.", 409);
  return record;
}
