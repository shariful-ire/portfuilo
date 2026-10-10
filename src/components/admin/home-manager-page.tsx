import { requireAdminPage } from "@/lib/auth/page-access";
import { listManaged, relatedOptions } from "@/lib/home-manager/admin";
import { listAdminMedia } from "@/lib/media/list";
import { cloudinaryConfigured } from "@/lib/media/cloudinary";
import type { ManagedKind, RelatedOptions } from "@/lib/home-manager/schema";
import { HomeManager } from "./home-manager";
export async function HomeManagerPage({ kind }: { kind: ManagedKind }) {
 await requireAdminPage(); let loaded;
 try { loaded = await Promise.all([listManaged(kind), kind === "sections" ? listAdminMedia() : [], kind === "sections" ? relatedOptions() : { projects: [], certificates: [], posts: [], skills: [], timeline: [] } as RelatedOptions]); }
 catch { return <><h1 className="text-3xl font-semibold">Content unavailable</h1><p role="alert" className="mt-5 text-muted">Saved content could not be loaded. Check database connectivity and reload before editing.</p></>; }
 return <><h1 className="mb-8 text-3xl font-semibold">{kind === "sections" ? "Homepage sections" : kind === "skills" ? "Skills" : "Education and experience"}</h1><HomeManager kind={kind} initial={loaded[0]} initialMedia={loaded[1]} related={loaded[2]} configured={cloudinaryConfigured()} /></>;
}
