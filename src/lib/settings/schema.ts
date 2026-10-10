import { contactEmail, whatsappValue, telegramValue, githubValue, linkedinValue, optionalContact } from "../contact/links";
import { z } from "zod";
import { site } from "../../config/site";
const optionalText = (max = 500) => z.string().trim().max(max).default("");
const optionalId = z.union([z.literal(""), z.uuid()]).default("");

export const settingsInputSchema = z.object({
  name: z.string().trim().min(1).max(200), shortName: z.string().trim().min(1).max(100),
  headline: z.string().trim().min(1).max(500), introduction: z.string().trim().min(1).max(5000), biography: optionalText(20_000),
  university: optionalText(), degree: optionalText(), department: optionalText(), city: optionalText(100), country: optionalText(100),
  publicEmail: optionalContact(contactEmail), whatsapp: optionalContact(whatsappValue), telegram: optionalContact(telegramValue),
  github: optionalContact(githubValue), linkedin: optionalContact(linkedinValue), availability: optionalText(200),
  photoMediaId: optionalId, cvMediaId: optionalId, sharingMediaId: optionalId,
  siteTitle: z.string().trim().min(1).max(200), siteDescription: z.string().trim().min(1).max(5000),
}).strict();
export type SettingsInput = z.infer<typeof settingsInputSchema>;
export const settingsDefaults: SettingsInput = settingsInputSchema.parse({ name: site.name, shortName: site.shortName, headline: site.hero, introduction: site.introduction, university: site.university, degree: site.degree, country: site.country, github: site.github, whatsapp: site.whatsapp, siteTitle: `${site.name} | Frontend, IoT & Robotics`, siteDescription: site.introduction });
