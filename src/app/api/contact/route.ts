import { revalidatePath } from "next/cache";
import { readJson, RequestError } from "@/lib/admin/http";
import { contactSubmissionSchema } from "@/lib/contact/schema";
import { publicContactContext, requestBudget, verifyToken, takeRate } from "@/lib/contact/protection";
import { saveContactMessage } from "@/lib/contact/store";
import { contactError } from "@/lib/contact/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
 try {
  const context = publicContactContext(request); await requestBudget(context, "submit");
  const { token, website, ...input } = contactSubmissionSchema.parse(await readJson(request, 48000));
  if (website || (input.message.match(/https?:\/\//gi)?.length ?? 0) > 5) throw new RequestError("This submission could not be accepted. Remove promotional links and try again.");
  const ticket = verifyToken(token, context.secret);
  await takeRate("submit-email", input.email.toLowerCase(), 3, 3600000, context.secret);
  await saveContactMessage(input, ticket);
  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard", "layout");
  return Response.json({ saved: true, message: "Your message has been saved. Thank you for getting in touch." }, { status: 201, headers: { "Cache-Control": "no-store" } });
 } catch (error) { return contactError(error); }
}
