import { SectionHeading } from "../ui/section-heading";
import { getPublicIdeas } from "@/lib/ideas/public";
import { Card } from "../ui/card";
export async function PublicIdeaSummaries() {
  let summaries;
  try { summaries = await getPublicIdeas(); } catch { return <p role="status" className="mt-16 text-muted">Approved summaries are temporarily unavailable. Please try again later.</p>; }
  return <section className="mt-20 border-t border-border pt-16" aria-labelledby="collaboration-summaries"><SectionHeading id="collaboration-summaries" icon="about">Approved collaboration summaries</SectionHeading><p className="mt-4 text-center text-muted">Shared with permission</p>{summaries.length ? <div className="mt-8 grid gap-6 md:grid-cols-2">{summaries.map((summary) => <Card key={summary.id}><p className="text-sm text-accent">{summary.category}</p><h3 className="mt-3 break-words text-2xl font-semibold">{summary.title}</h3><p className="mt-5 whitespace-pre-line break-words leading-8 text-muted">{summary.body}</p>{summary.contributor && <p className="mt-5 text-sm text-muted">Contributor: {summary.contributor}</p>}</Card>)}</div> : <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-muted">No collaboration summaries have been approved and published yet. New submissions are reviewed privately.</p>}</section>;
}
