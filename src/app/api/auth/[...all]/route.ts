import { getAuth } from "@/lib/auth/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  try { return await (await getAuth()).handler(request); }
  catch {
    return Response.json({ message: "Authentication is unavailable. Check server configuration and database connectivity." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
export const GET = handle;
export const POST = handle;
