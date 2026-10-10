import { PageContainer } from "@/components/layout/page-container";
import { requirePublicPage } from "@/lib/settings/pages";
import { publicMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() { return publicMetadata("/about", "About"); }
export default async function AboutPage() {
  const page = await requirePublicPage("/about");
  return <PageContainer className="py-16"><h1 className="section-heading">{page.title}</h1>{page.introduction && <p className="mt-6 max-w-3xl whitespace-pre-line leading-8 text-muted">{page.introduction}</p>}<div className="mt-12 space-y-10">{page.blocks.map((block, i) => <section key={i}>{block.heading && <h2 className="text-2xl font-semibold">{block.heading}</h2>}<p className="mt-4 max-w-3xl whitespace-pre-line leading-8 text-muted">{block.text}</p></section>)}</div></PageContainer>;
}
