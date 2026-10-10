import { z } from "zod";
import { revalidatePath } from "next/cache";
import { readJson, RequestError } from "@/lib/admin/http";
import { ideaSubmissionSchema } from "@/lib/ideas/schema";
import { saveIdea } from "@/lib/ideas/store";
import { publicContactContext, requestBudget, verifyToken, takeRate, ContactRateError } from "@/lib/contact/protection";
import { getPresentation } from "@/lib/settings/public";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const context = publicContactContext(request); await requestBudget(context, "submit");
    if (!(await getPresentation()).pages.find((page) => page.path === "/ideas")?.enabled) throw new RequestError("Idea submissions are currently disabled.", 404);
    const { token, website, ...input } = ideaSubmissionSchema.parse(await readJson(request, 100_000));
    if (website || ([input.description, input.problem, input.collaboration].join(" ").match(/https?:\/\//gi)?.length ?? 0) > 5) throw new RequestError("Remove promotional links and try again.");
    const ticket = verifyToken(token, context.secret);
    await takeRate("idea-email", input.email.toLowerCase(), 3, 3600000, context.secret);
    await saveIdea(input, ticket);
    revalidatePath("/dashboard/ideas");
    return Response.json({ saved: true, message: "Your idea has been saved for private review. Thank you." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof RequestError ? error.status : error instanceof z.ZodError ? 400 : 503;
    const message = error instanceof RequestError ? error.message : error instanceof z.ZodError ? "Check the idea fields, length limits and required consent." : "Idea submissions are temporarily unavailable. Please try again later.";
    return Response.json({ message }, { status, headers: { "Cache-Control": "no-store", ...(error instanceof ContactRateError ? { "Retry-After": String(error.retryAfter) } : {}) } });
  }
}
