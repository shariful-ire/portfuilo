import { requireAdminPage } from "@/lib/auth/page-access";
import { listAdminCertificates } from "@/lib/certificates/admin";
import { listAdminMedia } from "@/lib/media/list";
import { cloudinaryConfigured } from "@/lib/media/cloudinary";
import { CertificatesManager } from "@/components/admin/certificates-manager";
export default async function CertificatesAdminPage() {
  await requireAdminPage();
  let loaded;
  try { loaded = await Promise.all([listAdminCertificates(), listAdminMedia()]); }
  catch { return <><h1 className="text-3xl font-semibold">Certificates unavailable</h1><p role="alert" className="mt-5 text-muted">Saved certificates could not be loaded. Check database connectivity and reload before editing.</p></>; }
  return <><h1 className="mb-8 text-3xl font-semibold">Manage certificates</h1><CertificatesManager initial={loaded[0]} initialMedia={loaded[1]} configured={cloudinaryConfigured()} /></>;
}
