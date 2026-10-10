import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { MongoServerError } from "mongodb";
import { getDatabase } from "../db/connection";
import { RequestError } from "../admin/http";
import { contactEnvironment, ContactConfigurationError } from "./environment";
export class ContactRateError extends RequestError { constructor(public retryAfter: number) { super("Too many requests. Please wait before trying again.", 429); } }
export function digest(secret: string, value: string) { return createHmac("sha256", secret).update(value).digest("hex"); }
export function issueToken(secret: string, now = Date.now()) { const payload = `${randomUUID()}.${now}`; return `${payload}.${digest(secret, `form:${payload}`)}`; }
export function verifyToken(token: string, secret: string, now = Date.now()) {
 const match = /^([0-9a-f-]{36})\.(\d{13})\.([0-9a-f]{64})$/.exec(token);
 if (!match) throw new RequestError("Refresh the form before submitting.");
 const [, id, time, signature] = match; const expected = digest(secret, `form:${id}.${time}`);
 if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new RequestError("Refresh the form before submitting.");
 const age = now - Number(time);
 if (age < 2000) throw new RequestError("Please take a moment before submitting.");
 if (age >= 3600000) throw new RequestError("This form has expired. Refresh the form and try again.");
 return { id, expiresAt: new Date(Number(time) + 3600000) };
}
export function clientIdentity(request: Request, header: string) {
 if (!header) return null;
 const raw = request.headers.get(header)?.trim();
 if (!raw || !isIP(raw)) throw new ContactConfigurationError();
 if (raw.toLowerCase().startsWith("::ffff:") && isIP(raw.slice(7)) === 4) return raw.slice(7);
 return isIP(raw) === 6 ? new URL(`http://[${raw}]/`).hostname.toLowerCase() : raw;
}
export function publicContactContext(request: Request) {
 const config = contactEnvironment();
 if (request.headers.get("origin") !== config.origin) throw new RequestError("Request origin is not allowed.", 403);
 return { ...config, ip: clientIdentity(request, config.ipHeader) };
}
export async function takeRate(scope: string, identity: string, limit: number, windowMs: number, secret: string, now = Date.now()) {
 const window = Math.floor(now / windowMs); const end = (window + 1) * windowMs;
 const id = `${scope}:${window}:${digest(secret, identity)}`;
 const collection = (await getDatabase()).collection<{ _id: string; count: number; expiresAt: Date }>("contactRateLimits");
 try {
  const result = await collection.updateOne({ _id: id, count: { $lt: limit } }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(end + 86400000) } }, { upsert: true });
  if (!result.acknowledged || (!result.matchedCount && !result.upsertedCount)) throw new Error("Rate write not acknowledged");
 } catch (error) { if (error instanceof MongoServerError && error.code === 11000) throw new ContactRateError(Math.max(1, Math.ceil((end - now) / 1000))); throw error; }
}
export async function requestBudget(context: ReturnType<typeof publicContactContext>, purpose: "token" | "submit") {
 await takeRate(`${purpose}-global`, "all", purpose === "token" ? 500 : 100, 900000, context.secret);
 if (context.ip) await takeRate(`${purpose}-ip`, context.ip, purpose === "token" ? 30 : 5, 900000, context.secret);
}
