import { z } from "zod";
export const IMAGE_LIMIT = 5 * 1024 * 1024;
export const VIDEO_LIMIT = 4 * 1024 * 1024;
export const PDF_LIMIT = 10 * 1024 * 1024;
export const uploadInputSchema = z.object({
  name: z.string().min(1).max(200).regex(/^[^\x00-\x1f/\\]+$/),
  mime: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"]),
  size: z.number().int().positive().max(PDF_LIMIT),
  alt: z.string().trim().max(500).default(""),
}).strict().superRefine((value, context) => {
  if (value.mime.startsWith("image/") && value.size > IMAGE_LIMIT) context.addIssue({ code: "custom", message: "Images must be at most 5 MiB.", path: ["size"] });
  if (value.mime === "video/mp4" && value.size > VIDEO_LIMIT) context.addIssue({ code: "custom", message: "MP4 videos must be at most 4 MiB.", path: ["size"] });
  if (value.mime !== "application/pdf" && !value.alt) context.addIssue({ code: "custom", message: "Describe the image for accessibility.", path: ["alt"] });
});
export type UploadInput = z.infer<typeof uploadInputSchema>;
export function detectFileType(bytes: Uint8Array): UploadInput["mime"] | null {
  if (bytes.length < 12) return null;
  const starts = (pattern: number[]) => pattern.every((byte, index) => bytes[index] === byte);
  if ([0x66,0x74,0x79,0x70].every((byte,index)=>bytes[index+4]===byte) && ["isom","iso2","mp41","mp42","avc1","M4V "].includes(String.fromCharCode(...bytes.slice(8,12)))) return "video/mp4";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0x52, 0x49, 0x46, 0x46]) && [0x57, 0x45, 0x42, 0x50].every((byte, index) => bytes[index + 8] === byte)) return "image/webp";
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  return null;
}
export function validateFile(bytes: Uint8Array, input: UploadInput) {
  uploadInputSchema.parse(input);
  if (bytes.length !== input.size || detectFileType(bytes) !== input.mime) throw new Error("File contents, type, or size do not match the upload request.");
}
