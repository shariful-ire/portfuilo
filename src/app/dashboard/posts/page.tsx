import { requireAdminPage } from "@/lib/auth/page-access";
import { listAdminPosts } from "@/lib/posts/admin";
import { listAdminMedia } from "@/lib/media/list";
import { cloudinaryConfigured } from "@/lib/media/cloudinary";
import { PostsManager } from "@/components/admin/posts-manager";
export default async function PostsAdminPage() {
  await requireAdminPage();
  let loaded;
  try { loaded = await Promise.all([listAdminPosts(), listAdminMedia()]); }
  catch { return <><h1 className="text-3xl font-semibold">Posts unavailable</h1><p role="alert" className="mt-5 text-muted">Saved posts could not be loaded. Check database connectivity and reload before editing.</p></>; }
  return <><h1 className="mb-8 text-3xl font-semibold">Manage posts</h1><PostsManager initial={loaded[0]} initialMedia={loaded[1]} configured={cloudinaryConfigured()} /></>;
}
