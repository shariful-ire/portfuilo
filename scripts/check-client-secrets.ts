import { loadEnvConfig } from "@next/env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
loadEnvConfig(process.cwd());
async function main() {
  const names = ["MONGODB_URI", "BETTER_AUTH_SECRET", "GOOGLE_CLIENT_SECRET", "CLOUDINARY_API_SECRET", "CLOUDINARY_API_KEY", "CONTACT_FORM_SECRET", "ADMIN_EMAIL"];
  const secrets = names.flatMap((name) => process.env[name]?.length ? [{ name, value: process.env[name]! }] : []);
  if (process.env.MONGODB_URI) {
    const url = new URL(process.env.MONGODB_URI);
    if (url.password) secrets.push({ name: "MongoDB password", value: decodeURIComponent(url.password) });
  }
  let scanned = 0;
  async function scan(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await scan(file);
      else if (/\.(js|css|json|map|html)$/.test(file)) {
        const content = await readFile(file, "utf8"); scanned++;
        for (const secret of secrets) if (content.includes(secret.value) || content.includes(encodeURIComponent(secret.value))) throw new Error(`Client output contains configured ${secret.name}.`);
      }
    }
  }
  await scan(".next/static");
  if (!scanned) throw new Error("No client output found. Run the production build first.");
  console.log(`Client secret scan passed (${scanned} files; ${secrets.length} configured sensitive values checked). Unconfigured values cannot be scanned.`);
}
main().catch((error: unknown) => { console.error(error instanceof Error && error.message.startsWith("Client output contains") ? error.message : "Client secret scan failed. Verify the production build exists."); process.exitCode = 1; });
