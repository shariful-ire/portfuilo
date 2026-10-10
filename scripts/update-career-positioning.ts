import { loadEnvConfig } from "@next/env";
import { getCollection } from "../src/lib/db/collections";
import { closeDatabase } from "../src/lib/db/connection";
import { site } from "../src/config/site";

// One-time, idempotent maintenance: exact-value filters preserve owner edits.
loadEnvConfig(process.cwd());
async function main() {
  try {
    const profiles = await getCollection("profiles");
    const previousIntroduction = "I’m Md. Shariful Islam, a frontend developer and IoT & Robotics Engineering student at the University of Frontier Technology, Bangladesh. I enjoy turning ideas into practical web applications and interactive hardware.";
    const replacements = [
      ["headline", "Building web experiences and intelligent devices.", site.hero],
      ["introduction", previousIntroduction, site.introduction],
      ["degree", "BSc in Internet of Things and Robotics Engineering (IRE)", site.degree],
    ] as const;
    let changed = 0;
    for (const [field, before, after] of replacements) {
      const result = await profiles.updateOne({ key: "owner", [field]: before }, { $set: { [field]: after, updatedAt: new Date() } });
      changed += result.modifiedCount;
    }
    console.log(`Career positioning: ${changed} default fields updated; custom values preserved.`);
  } catch {
    console.error("Career positioning update failed. Check MongoDB configuration and connectivity; retry is safe.");
    process.exitCode = 1;
  } finally { await closeDatabase(); }
}
void main();
