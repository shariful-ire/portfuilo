import { randomUUID, createHmac } from "node:crypto";
import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { uploadInputSchema } from "@/lib/media/policy";
import { cloudinaryServer, uploadParameters } from "@/lib/media/cloudinary";
import { uploads } from "@/lib/media/storage";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const admin = await authorizeMutation(request);
    const input = uploadInputSchema.parse(await readJson(request));
    const { env } = cloudinaryServer();
    const id = randomUUID();
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    // A domain-separated proxy signature cannot be replayed directly against
    // Cloudinary to bypass our byte limits. The SDK creates the actual provider
    // signature only on the server, after file validation in the PUT handler.
    const signature = createHmac("sha256", env.CLOUDINARY_API_SECRET).update(JSON.stringify({ purpose: "portfolio-upload-proxy", ownerId: admin.id, input, params: uploadParameters(id, input.mime, timestamp) })).digest("hex");
    await (await uploads()).insertOne({ _id: id, ownerId: admin.id, input, signature, timestamp, state: "pending", createdAt: now, updatedAt: now, expiresAt: new Date(now.getTime() + 5 * 60_000), revision: 0 });
    // Cloud name/key/secret stay on the server. The browser sends bytes to our
    // authorized proxy, never directly to Cloudinary where byte caps can be bypassed.
    return Response.json({ id, signature }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
