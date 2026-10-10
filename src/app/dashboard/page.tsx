import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/page-access";
import { Card } from "@/components/ui/card";
const actions = [
 ["ideas", "Review ideas & research", "Review private proposals and manage consented collaboration summaries."],
 ["projects", "Add / manage projects", "Create a draft, attach images, preview, and publish your work."],
 ["certificates", "Add / manage certificates", "Upload certificate images or PDFs and publish genuine credentials."],
 ["posts", "Write a post", "Draft, preview, and publish an article."],
 ["sections", "Arrange homepage sections", "Show, hide, and reorder sections. Choose which records to feature."],
 ["settings", "Edit profile & contact", "Update your biography, phone/WhatsApp, email, CV, and site settings."],
 ["inbox", "Read contact messages", "View saved messages and manage your private inbox."],
] as const;
export default async function Dashboard() {
 await requireAdminPage();
 return <><h1 className="text-3xl font-semibold">Manage your portfolio</h1><p className="mt-3 leading-7 text-muted">Choose what you want to update. Drafts stay private until you publish them.</p><div className="mt-8 grid gap-5 lg:grid-cols-2">{actions.map(([path, title, description]) => <Card key={path}><h2 className="text-lg font-semibold"><Link href={`/dashboard/${path}`} className="text-accent underline-offset-4 hover:underline">{title} &rarr;</Link></h2><p className="mt-3 text-sm leading-7 text-muted">{description}</p></Card>)}</div></>;
}
