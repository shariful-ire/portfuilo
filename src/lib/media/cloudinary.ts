import "server-only";
import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from "cloudinary";
import { z } from "zod";
import { RequestError } from "../admin/http";

const environment = z.object({ CLOUDINARY_CLOUD_NAME: z.string().regex(/^[a-zA-Z0-9_-]+$/), CLOUDINARY_API_KEY: z.string().min(1), CLOUDINARY_API_SECRET: z.string().min(1) });
export function cloudinaryConfigured() { return environment.safeParse(process.env).success; }
export function cloudinaryServer() {
  const env = environment.safeParse(process.env);
  if (!env.success) throw new RequestError("Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server, then restart. Uploads are disabled until configured.", 503);
  cloudinary.config({ cloud_name: env.data.CLOUDINARY_CLOUD_NAME, api_key: env.data.CLOUDINARY_API_KEY, api_secret: env.data.CLOUDINARY_API_SECRET, secure: true, timeout: 60_000 });
  return { sdk: cloudinary, env: env.data };
}
export function uploadParameters(id: string, mime: string, timestamp: number) {
  const allowed_formats: UploadApiOptions["allowed_formats"] = mime === "video/mp4" ? ["mp4"] : mime === "application/pdf" ? ["pdf"] : ["jpg", "jpeg", "png", "webp"];
  return { resource_type: (mime === "video/mp4" ? "video" : "image") as "video" | "image", public_id: `portfolio/${id}`, timestamp, overwrite: false, allowed_formats };
}
export async function uploadToCloudinary(bytes: Buffer, params: ReturnType<typeof uploadParameters>) {
  const { sdk } = cloudinaryServer();
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = sdk.uploader.upload_stream({ ...params, timeout: 60_000 }, (error, result) => {
      if (error || !result) reject(new RequestError("Cloudinary upload failed. The upload record was retained for cleanup. Check Cloudinary configuration and try again.", 502));
      else resolve(result);
    });
    stream.on("error", () => reject(new RequestError("Cloudinary upload failed. Retry or delete the failed upload.", 502)));
    stream.end(bytes);
  });
}
export async function destroyCloudinary(publicId: string, resourceType: "image" | "video" = "image") {
  const { sdk } = cloudinaryServer();
  const result = await sdk.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  if (!["ok", "not found"].includes(result.result)) throw new RequestError("Cloudinary deletion failed. The asset is retained for retry.", 502);
}
