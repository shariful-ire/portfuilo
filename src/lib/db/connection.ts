import "server-only";
import { MongoClient } from "mongodb";
import { z } from "zod";
import { setServers } from "node:dns";
import { isIP } from "node:net";

export class DatabaseConfigurationError extends Error {
  constructor() { super("MongoDB is not configured. Set valid MONGODB_URI and MONGODB_DB_NAME server environment variables."); this.name = "DatabaseConfigurationError"; }
}
export class DatabaseUnavailableError extends Error {
  constructor() { super("MongoDB is unavailable. Check server connectivity, database credentials, and network access."); this.name = "DatabaseUnavailableError"; }
}
const environment = z.object({ MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\/\S+$/), MONGODB_DB_NAME: z.string().min(1).max(63).regex(/^[a-zA-Z0-9_-]+$/), MONGODB_DNS_SERVERS: z.string().optional().transform((value) => value?.split(",").map((ip) => ip.trim()).filter(Boolean) ?? []).refine((servers) => servers.length <= 3 && servers.every((ip) => isIP(ip) !== 0)) });
const globalDatabase = globalThis as typeof globalThis & { portfolioMongo?: Promise<MongoClient> };

export function databaseEnvironment() {
  const result = environment.safeParse(process.env);
  if (!result.success) throw new DatabaseConfigurationError();
  return result.data;
}

export async function getMongoClient() {
  const env = databaseEnvironment();
  if (!globalDatabase.portfolioMongo) {
    // Explicit opt-in for networks whose default resolver blocks Atlas SRV/TXT.
    // Changes Node's resolver in this process only, not OS DNS settings.
    if (env.MONGODB_DNS_SERVERS.length) setServers(env.MONGODB_DNS_SERVERS);
    const client = new MongoClient(env.MONGODB_URI, { maxPoolSize: 10, minPoolSize: 0, maxIdleTimeMS: 60_000, serverSelectionTimeoutMS: 5_000, connectTimeoutMS: 5_000, waitQueueTimeoutMS: 5_000 });
    globalDatabase.portfolioMongo = client.connect().catch(async () => {
      globalDatabase.portfolioMongo = undefined;
      await client.close().catch(() => undefined);
      throw new DatabaseUnavailableError();
    });
  }
  return await globalDatabase.portfolioMongo;
}

export async function getDatabase() {
  const env = databaseEnvironment();
  return (await getMongoClient()).db(env.MONGODB_DB_NAME);
}

// For CLI shutdown only, never close the shared pool after individual requests.
export async function closeDatabase() {
  const pending = globalDatabase.portfolioMongo;
  globalDatabase.portfolioMongo = undefined;
  if (pending) await (await pending).close();
}
