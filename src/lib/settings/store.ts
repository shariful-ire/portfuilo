import { parsePresentation } from "./presentation";
import "server-only";
import { getCollection } from "../db/collections";
import { profileSchema, siteSettingsSchema } from "../content/models";
import { settingsDefaults, settingsInputSchema, type SettingsInput } from "./schema";
import { transaction, lockReadyMedia } from "../media/storage";
import { RequestError } from "../admin/http";

export async function loadSettingsForm() {
  const [profile, settings] = await Promise.all([(await getCollection("profiles")).findOne({ key: "owner" }), (await getCollection("siteSettings")).findOne({ key: "site" })]);
  const input = { ...settingsDefaults };
  if (profile) {
    const p = profileSchema.parse(profile);
    for (const key of Object.keys(input) as (keyof SettingsInput)[]) {
      if (key in p) input[key] = String(p[key as keyof typeof p] ?? "");
      else if (!["siteTitle", "siteDescription", "sharingMediaId", "presentationJson", "webFocusTitle", "webFocusDescription", "hardwareFocusTitle", "hardwareFocusDescription"].includes(key)) input[key] = "";
    }
    input.customContactsJson = JSON.stringify(p.customContacts);
    input.headline = p.headline ?? settings?.heroText ?? settingsDefaults.headline;
  }
  if (settings) { const s = siteSettingsSchema.parse(settings); if (s.presentation) input.presentationJson = JSON.stringify(s.presentation); input.siteTitle = s.title; input.siteDescription = s.description; input.sharingMediaId = s.sharingMediaId ?? ""; }
  return input;
}

// Caller must authorize with requireAdmin before invoking any write.
export async function saveSettings(input: SettingsInput) {
  const data = settingsInputSchema.parse(input);
  const presentation = parsePresentation(data.presentationJson);
  const optional = (value: string) => value || undefined;
  await transaction(async (session) => {
    const profiles = await getCollection("profiles");
    const settings = await getCollection("siteSettings");
    // Deterministic singleton IDs make concurrent first saves conflict even
    // before the optional setup indexes have been installed.
    const previousProfile = await profiles.findOne({ key: "owner" }, { session });
    const previousSettings = await settings.findOne({ key: "site" }, { session });
    for (const [id, kind] of [[data.photoMediaId, "image"], [data.cvMediaId, "document"], [data.sharingMediaId, "image"], [presentation.logoId, "image"], [presentation.lightLogoId, "image"], [presentation.darkLogoId, "image"], [presentation.faviconId, "image"]] as const) {
      if (!id) continue;
      if (!await lockReadyMedia(id, session)) throw new RequestError("Selected media is unavailable or being deleted. Refresh and select a completed upload.", 409);
      const asset = await (await getCollection("media")).findOne({ _id: id, kind }, { session });
      if (!asset || (kind === "document" && asset.mimeType !== "application/pdf")) throw new RequestError("Choose an image for photos/sharing and a PDF for the CV.");
      if (id === presentation.faviconId && (asset.mimeType !== "image/png" || asset.width !== asset.height || ![32, 48, 96, 180, 192, 512].includes(asset.width ?? 0))) throw new RequestError("Favicon must be a square PNG: 32, 48, 96, 180, 192 or 512 pixels.");
      await (await getCollection("media")).updateOne({ _id: id }, { $set: { status: "published", updatedAt: new Date() } }, { session });
    }
    const now = new Date();
    const profile = profileSchema.parse({
      _id: previousProfile?._id ?? "11111111-1111-4111-8111-111111111111", createdAt: previousProfile?.createdAt ?? now, updatedAt: now, key: "owner", status: "published", displayOrder: 0,
      customContacts: JSON.parse(data.customContactsJson),
      name: data.name, shortName: data.shortName, headline: data.headline, introduction: data.introduction,
      webFocusTitle: data.webFocusTitle, webFocusDescription: data.webFocusDescription, hardwareFocusTitle: data.hardwareFocusTitle, hardwareFocusDescription: data.hardwareFocusDescription,
      biography: optional(data.biography), university: optional(data.university), degree: optional(data.degree), department: optional(data.department), city: optional(data.city), country: optional(data.country),
      publicEmail: optional(data.publicEmail), whatsapp: optional(data.whatsapp), telegram: optional(data.telegram), github: optional(data.github), linkedin: optional(data.linkedin), availability: optional(data.availability), photoMediaId: optional(data.photoMediaId), cvMediaId: optional(data.cvMediaId),
    });
    const site = siteSettingsSchema.parse({ _id: previousSettings?._id ?? "22222222-2222-4222-8222-222222222222", createdAt: previousSettings?.createdAt ?? now, updatedAt: now, status: "published", displayOrder: 0, key: "site", presentation, title: data.siteTitle, description: data.siteDescription, heroText: data.headline, sharingMediaId: optional(data.sharingMediaId) });
    await profiles.replaceOne({ _id: profile._id }, profile, { upsert: true, session });
    await settings.replaceOne({ _id: site._id }, site, { upsert: true, session });
  });
}
