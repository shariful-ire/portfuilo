import { publicContactContext, requestBudget, issueToken } from "@/lib/contact/protection";
import { contactError } from "@/lib/contact/http";
export const runtime = "nodejs";
export async function POST(request: Request) { try { const context = publicContactContext(request); await requestBudget(context, "token"); return Response.json({ token: issueToken(context.secret) }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return contactError(error); } }
