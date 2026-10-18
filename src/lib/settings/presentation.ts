import { z } from "zod";

export const pagePaths = ["/projects", "/certificates", "/posts", "/about", "/ideas", "/products"] as const;
export const pageSchema = z.object({
  path: z.enum(pagePaths), enabled: z.boolean(), inNavigation: z.boolean(),
  label: z.string().trim().min(1).max(60), title: z.string().trim().min(1).max(200),
  introduction: z.string().trim().max(2000), seoTitle: z.string().trim().max(200), seoDescription: z.string().trim().max(1000),
  blocks: z.array(z.object({ heading: z.string().trim().max(200), text: z.string().trim().max(10000) }).strict()).max(12),
}).strict();
const asset = z.union([z.literal(""), z.uuid()]);
export const presentationSchema = z.object({
  siteName: z.string().trim().min(1).max(100), logoId: asset, lightLogoId: asset, darkLogoId: asset, faviconId: asset, logoAlt: z.string().trim().max(300),
  animations: z.boolean(), accent: z.enum(["cyan", "sky", "mint"]),
  roles: z.array(z.string().trim().min(1).max(120)).max(5),
  pages: z.array(pageSchema).min(4).max(6).refine((pages) => new Set(pages.map((page) => page.path)).size === pages.length && ["/projects", "/certificates", "/posts", "/about"].every((path) => pages.some((page) => page.path === path)), "Each supported page must appear once").transform((pages) => {
    const result = [...pages];
    for (const [path, title] of [["/ideas", "Ideas & Research"], ["/products", "Products"]] as const) if (!result.some(page => page.path === path)) result.push({path,label:title,title,enabled:true,inNavigation:true,introduction:"",seoTitle:"",seoDescription:"",blocks:[]});
    return result;
  }),
}).strict().refine((p) => !(p.logoId || p.lightLogoId || p.darkLogoId) || !!p.logoAlt, "Logo alt text is required");
export type Presentation = z.infer<typeof presentationSchema>;
export const presentationDefaults: Presentation = {
  siteName: "Shariful", logoId: "", lightLogoId: "", darkLogoId: "", faviconId: "", logoAlt: "",
  animations: true, accent: "cyan", roles: ["Web Developer", "IoT & Robotics Enthusiast", "Building Software & Connected Devices"],
  pages: pagePaths.map((path) => { const title = path === "/ideas" ? "Ideas & Research" : path.slice(1)[0].toUpperCase() + path.slice(2); return { path, label: title, title, enabled: path !== "/about", inNavigation: path !== "/about", introduction: "", seoTitle: "", seoDescription: "", blocks: [] }; }),
};
// The existing form uses string fields; JSON is only its transport format.
// MongoDB stores the validated, typed object, never an unchecked JSON blob.
export const presentationJsonSchema = z.string().max(150000).superRefine((value, ctx) => {
  try { const parsed = presentationSchema.safeParse(JSON.parse(value)); if (!parsed.success) ctx.addIssue({ code: "custom", message: parsed.error.issues.map((issue) => issue.message).join("; ") }); }
  catch { ctx.addIssue({ code: "custom", message: "Invalid presentation settings" }); }
}).default(JSON.stringify(presentationDefaults));
export function parsePresentation(value: string): Presentation { return presentationSchema.parse(JSON.parse(value)); }
export function configuredNavigation(p: Presentation) {
  return [{ label: "About", href: "/#about" }, ...p.pages.filter((page) => page.enabled && page.inNavigation).map((page) => ({ label: page.label, href: page.path })), { label: "Contact", href: "/#contact" }];
}
