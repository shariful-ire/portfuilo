import { getHomepageSections } from "@/lib/home-manager/public";
import { SectionRenderer } from "./section-renderer";
export async function HomeSections() {
 let sections; try { sections = await getHomepageSections(); } catch { return <p role="status" className="py-12 text-muted">Homepage sections are temporarily unavailable. Please try again later.</p>; }
 return <>{sections.map((section) => <SectionRenderer key={section.id} section={section} />)}</>;
}
