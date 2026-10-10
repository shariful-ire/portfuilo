import { requireAdminPage } from "@/lib/auth/page-access";
import { listIdeas } from "@/lib/ideas/admin";
import { IdeasManager } from "@/components/admin/ideas-manager";
export default async function IdeasDashboard() {
  await requireAdminPage(); let page;
  try { page = await listIdeas(); } catch { return <><h1 className="text-3xl font-semibold">Ideas unavailable</h1><p role="alert" className="mt-6 text-muted">Private submissions could not be loaded. Check database connectivity and reload.</p></>; }
  return <><h1 className="mb-8 text-3xl font-semibold">Ideas &amp; Research</h1><IdeasManager initial={page} /></>;
}
