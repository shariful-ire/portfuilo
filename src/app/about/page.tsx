import { PageContainer } from "@/components/layout/page-container";
import { requirePublicPage } from "@/lib/settings/pages";
import { publicMetadata } from "@/lib/seo/metadata";
import { getPublicSettings } from "@/lib/settings/public";

export async function generateMetadata() { return publicMetadata("/about", "About"); }
export default async function AboutPage() {
  const page = await requirePublicPage("/about");
  const { data: profile, unavailable } = await getPublicSettings();
  const introduction = page.introduction || profile.biography || profile.introduction;
  const education = [profile.degree, profile.department, profile.university].filter(Boolean).join("\n");
  const blocks = page.blocks.length ? page.blocks : education ? [{ heading: "Education", text: education }] : [];
  return <PageContainer className="public-index py-16"><h1 className="section-heading">{page.title}</h1>{introduction && <p className="mt-6 max-w-3xl whitespace-pre-line leading-8 text-muted">{introduction}</p>}{unavailable && <p role="status" className="mt-6 text-muted">Saved profile details are temporarily unavailable. Showing confirmed owner information.</p>}<div className="mx-auto mt-12 max-w-3xl space-y-10">{blocks.map((block, i) => <section key={i}>{block.heading && <h2 className="public-content-heading text-2xl font-semibold">{block.heading}</h2>}<p className="mt-4 max-w-3xl whitespace-pre-line leading-8 text-muted">{block.text}</p></section>)}</div></PageContainer>;
}
