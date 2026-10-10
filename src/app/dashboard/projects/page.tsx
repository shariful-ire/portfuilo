import { requireAdminPage } from "@/lib/auth/page-access";
import { listAdminProjects } from "@/lib/projects/admin";
import { listAdminMedia } from "@/lib/media/list";
import { cloudinaryConfigured } from "@/lib/media/cloudinary";
import { ProjectsManager } from "@/components/admin/projects-manager";
export default async function ProjectsAdminPage() {
  await requireAdminPage();
  let loaded;
  try { loaded = await Promise.all([listAdminProjects(), listAdminMedia()]); }
  catch { return <><h1 className="text-3xl font-semibold">Projects unavailable</h1><p role="alert" className="mt-5 text-muted">Saved projects could not be loaded. Check database connectivity and reload before editing.</p></>; }
  return <><h1 className="mb-8 text-3xl font-semibold">Manage projects</h1><ProjectsManager initial={loaded[0]} initialMedia={loaded[1]} configured={cloudinaryConfigured()} /></>;
}
