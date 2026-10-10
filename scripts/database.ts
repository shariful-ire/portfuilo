import { loadEnvConfig } from "@next/env";
import { closeDatabase, getDatabase, DatabaseConfigurationError, DatabaseUnavailableError } from "../src/lib/db/connection";
import { ensureDatabaseIndexes } from "../src/lib/db/indexes";

loadEnvConfig(process.cwd());
async function main() {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    console.log("MongoDB connection verified.");
    if (process.argv.includes("--indexes")) {
      await ensureDatabaseIndexes();
      console.log("MongoDB indexes verified/created.");
    }
  } catch (error) {
    console.error(error instanceof DatabaseConfigurationError || error instanceof DatabaseUnavailableError ? error.message : "MongoDB setup failed. Check database permissions, conflicting indexes, or duplicate records. No successful setup is claimed.");
    process.exitCode = 1;
  } finally { await closeDatabase().catch(() => undefined); }
}
void main();
