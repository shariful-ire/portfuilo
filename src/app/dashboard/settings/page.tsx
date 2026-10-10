import { requireAdminPage } from "@/lib/auth/page-access";
import { loadSettingsForm } from "@/lib/settings/store";
import { listAdminMedia } from "@/lib/media/list";
import { cloudinaryConfigured } from "@/lib/media/cloudinary";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  await requireAdminPage();
  let loaded;
  try {
    loaded = await Promise.all([loadSettingsForm(), listAdminMedia()]);
  } catch {
    return <><h1 className="text-3xl font-semibold">Settings unavailable</h1><p role="alert" className="mt-5 text-muted">Saved settings could not be loaded. Check MongoDB connectivity and reload the page before editing.</p></>;
  }
  const [initial, initialMedia] = loaded;
  return <><h1 className="mb-8 text-3xl font-semibold">Profile & settings</h1><SettingsForm initial={initial} initialMedia={initialMedia} cloudinaryConfigured={cloudinaryConfigured()} /></>;
}
