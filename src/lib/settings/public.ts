import "server-only";
import { cache } from "react";
import { getPublishedProfile, getPublishedSiteSettings, getPublishedMedia } from "../db/public-read";
import { settingsDefaults, type SettingsInput } from "./schema";

export const getPublicSettings = cache(async () => {
  const fallback = { data: { ...settingsDefaults }, photo: null, cv: null, sharing: null, unavailable: false };
  try {
    const [profile, settings] = await Promise.all([getPublishedProfile(), getPublishedSiteSettings()]);
    const data = { ...settingsDefaults };
    if (profile) {
      for (const key of Object.keys(data) as (keyof SettingsInput)[]) {
        if (key in profile) data[key] = String(profile[key as keyof typeof profile] ?? "");
        else if (!["siteTitle", "siteDescription", "sharingMediaId"].includes(key)) data[key] = "";
      }
      data.headline = profile.headline ?? settings?.heroText ?? settingsDefaults.headline;
    }
    if (settings) { data.siteTitle = settings.title; data.siteDescription = settings.description; data.sharingMediaId = settings.sharingMediaId ?? ""; }
    const [photo, cv, sharing] = await Promise.all([data.photoMediaId ? getPublishedMedia(data.photoMediaId) : null, data.cvMediaId ? getPublishedMedia(data.cvMediaId) : null, data.sharingMediaId ? getPublishedMedia(data.sharingMediaId) : null]);
    return { data, photo: photo?.kind === "image" ? photo : null, cv: cv?.mimeType === "application/pdf" ? cv : null, sharing: sharing?.kind === "image" ? sharing : null, unavailable: false };
  } catch {
    // Confirmed owner information is a presentation fallback, not a successful
    // DB response. Public UI and the admin UI explicitly report unavailability.
    return { ...fallback, unavailable: true };
  }
});
