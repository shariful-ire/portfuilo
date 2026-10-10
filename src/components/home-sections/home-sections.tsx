import { getPresentation } from "@/lib/settings/pages";
import { getHomepageSections } from "@/lib/home-manager/public";
import { SectionRenderer } from "./section-renderer";
export async function HomeSections() {
 let sections; try { sections = await getHomepageSections(); } catch { return <p role="status" className="py-12 text-muted">Homepage sections are temporarily unavailable. Please try again later.</p>; }
 const presentation = await getPresentation();
 const disabled = presentation.pages.filter((page) => !page.enabled).map((page) => page.path.slice(1));
 return <>{sections.filter((section) => !disabled.includes(section.content.type)).map((section) => <SectionRenderer key={section.id} section={section} />)}</>;
}
