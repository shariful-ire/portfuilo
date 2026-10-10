import { z } from "zod";
import type { MediaItem } from "./list";

const savedUploadSchema = z.object({
  id: z.uuid(),
  state: z.literal("ready"),
  kind: z.enum(["image", "document"]),
  name: z.string().min(1),
  alt: z.string(),
  url: z.url().refine((value) => new URL(value).protocol === "https:"),
});

export function confirmedUpload(value: unknown, expectedId: string, expectedKind: MediaItem["kind"]): MediaItem {
  const result = savedUploadSchema.safeParse(value);
  if (!result.success || result.data.id !== expectedId || result.data.kind !== expectedKind) {
    throw new Error("The server returned incomplete upload metadata. Refresh the media list before retrying.");
  }
  return result.data;
}

export function mergeUploadedMedia(items: MediaItem[], uploaded: MediaItem): MediaItem[] {
  return [uploaded, ...items.filter((item) => item.id !== uploaded.id)];
}
