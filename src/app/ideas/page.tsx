import { PublicIdeaSummaries } from "@/components/ideas/public-summaries";
import { PageContainer } from "@/components/layout/page-container";
import { IdeaForm } from "@/components/ideas/idea-form";
import { requirePublicPage } from "@/lib/settings/pages";
import { publicMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() { return publicMetadata("/ideas", "Ideas & Research", "Propose a web, IoT, robotics or research collaboration with Shariful."); }
export default async function IdeasPage() {
  const page = await requirePublicPage("/ideas");
  return <PageContainer className="public-index py-16 sm:py-24"><p className="section-eyebrow">Collaborate</p><h1 className="section-heading">{page.title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{page.introduction || "Have an idea for a web application, IoT device, robotics project, or research collaboration? Share it with me."}</p><IdeaForm /><PublicIdeaSummaries /></PageContainer>;
}
