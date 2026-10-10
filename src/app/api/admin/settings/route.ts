import { revalidatePath } from "next/cache";
import { authorizeMutation, readJson, apiError } from "@/lib/admin/http";
import { settingsInputSchema } from "@/lib/settings/schema";
import { saveSettings } from "@/lib/settings/store";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    await authorizeMutation(request);
    await saveSettings(settingsInputSchema.parse(await readJson(request, 250_000)));
    revalidatePath("/", "layout");
    revalidatePath("/dashboard/settings");
    return Response.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
