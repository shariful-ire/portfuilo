"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ideaCategories, reviewStates } from "@/lib/ideas/schema";
import { ideaReviewSchema, type IdeaDetail, type IdeaPage, type IdeaReview } from "@/lib/ideas/review-schema";
import { emailHref } from "@/lib/contact/links";
import { Button, buttonStyles } from "../ui/button";
import { Input, fieldStyles } from "../ui/input";
import { Textarea } from "../ui/textarea";

export function IdeasManager({ initial }: { initial: IdeaPage }) {
  const [page, setPage] = useState(initial); const [query, setQuery] = useState({ q: "", status: "all", category: "all", publication: "all" });
  const [selected, setSelected] = useState<IdeaDetail | null>(null); const [review, setReview] = useState<IdeaReview | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [preview, setPreview] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null); const router = useRouter();
  async function json(url: string, init?: RequestInit) { const response = await fetch(url, { ...init, cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(body.message || "Ideas unavailable."); return body; }
  async function run(work: () => Promise<void>) { setBusy(true); setError(""); setNotice(""); try { await work(); } catch (e) { setError(e instanceof Error ? e.message : "Operation failed."); } finally { setBusy(false); } }
  async function load(number = 1) { setPage(await json(`/api/admin/ideas?${new URLSearchParams({ ...query, page: String(number) })}`)); }
  async function open(id: string) {
    const item: IdeaDetail = await json(`/api/admin/ideas/${id}`); setSelected(item);
    setReview({ expectedUpdatedAt: item.updatedAt, reviewStatus: item.reviewStatus, adminNotes: item.adminNotes, publicationState: item.publicationState, approved: item.approved, summaryTitle: item.summaryTitle, summaryBody: item.summaryBody, contributor: item.contributor });
    setPreview(false); requestAnimationFrame(() => titleRef.current?.focus());
  }
  async function save(publicationState = review?.publicationState) {
    if (!selected || !review || !publicationState) return;
    const parsed = ideaReviewSchema.parse({ ...review, publicationState });
    await json(`/api/admin/ideas/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
    await open(selected.id); await load(page.page); router.refresh(); setNotice(publicationState === "published" ? "Approved summary published." : "Private review saved. Summary is unpublished.");
  }
  return <div className="space-y-8">
    <p className="leading-7 text-muted">Submissions and notes are private. Reply opens your email application; this site does not send email. Only a separately edited, consented and explicitly approved summary can be published.</p>
    {error && <p role="alert" className="break-words text-red-300">{error}</p>}{notice && <p role="status" className="text-accent">{notice}</p>}{busy && <p role="status">Loading or saving...</p>}
    <form className="flex flex-wrap items-end gap-4" onSubmit={(e) => { e.preventDefault(); void run(async () => { await load(); setSelected(null); }); }}>
      <label className="min-w-0 flex-1 text-sm">Search title or sender<Input value={query.q} maxLength={100} onChange={(e) => setQuery({ ...query, q: e.target.value })} disabled={busy} /></label>
      {([['status', 'Review status', reviewStates], ['category', 'Category', ideaCategories], ['publication', 'Publication', ['draft', 'published']]] as const).map(([key, label, options]) => <label key={key} className="text-sm">{label}<select className={fieldStyles} value={query[key]} disabled={busy} onChange={(e) => setQuery({ ...query, [key]: e.target.value })}><option value="all">All</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>)}<Button type="submit" disabled={busy}>Apply filters</Button>
    </form>
    <p className="text-sm text-muted">{page.total} submissions</p>
    <ol className="space-y-4">{page.items.map((item) => <li key={item.id} className="rounded-xl border border-border bg-surface p-5"><h2 className="break-words text-xl font-semibold">{item.title}</h2><p className="mt-2 break-words text-sm text-muted">{item.name} / {item.email}</p><p className="mt-2 text-sm text-accent">{item.category} · {item.reviewStatus} · {item.publicationState}</p><time dateTime={item.createdAt} className="mt-2 block text-xs text-muted">{new Date(item.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} (Bangladesh)</time><Button className="mt-4" variant="secondary" disabled={busy} onClick={() => run(() => open(item.id))}>Review submission</Button></li>)}</ol>
    {!page.items.length && <p className="rounded-xl border border-dashed border-border p-6 text-muted">No ideas match this page and these filters.</p>}
    <nav aria-label="Idea pages" className="flex gap-3"><Button variant="secondary" disabled={busy || page.page <= 1} onClick={() => run(async () => { await load(page.page - 1); setSelected(null); })}>Previous</Button><Button variant="secondary" disabled={busy || page.page * page.limit >= page.total || page.page >= 1000} onClick={() => run(async () => { await load(page.page + 1); setSelected(null); })}>Next</Button></nav>
    {selected && review && <section className="space-y-6 rounded-2xl border border-border p-5 sm:p-8" aria-labelledby="idea-review-title">
      <h2 id="idea-review-title" ref={titleRef} tabIndex={-1} className="break-words text-2xl font-semibold">{selected.title}</h2>
      <p className="break-words text-muted">{selected.name} · {selected.email}{selected.organization ? ` · ${selected.organization}` : ""}</p>
      {([['Idea description', selected.description], ['Problem', selected.problem], ['Collaboration requested', selected.collaboration], ['Timeline', selected.timeline]] as const).map(([label, value]) => value && <div key={label}><h3 className="font-semibold">{label}</h3><p className="mt-2 whitespace-pre-wrap break-words leading-8 text-muted">{value}</p></div>)}
      {selected.referenceUrl && <a href={selected.referenceUrl} target="_blank" rel="noopener noreferrer" className="inline-block break-all text-accent underline">Open reference</a>}
      <p className="text-sm text-muted">Consent recorded {new Date(selected.consentAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} (Bangladesh). Publication: {selected.publicationConsent ? "allowed" : "not allowed"}. Attribution: {selected.attributionConsent ? "allowed" : "not allowed"}.</p>
      <a href={emailHref(selected.email, `Re: ${selected.title}`)} className={buttonStyles("secondary")}>Open email reply</a>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void run(() => save()); }}><fieldset disabled={busy} className="space-y-5">
        <label className="block">Review status<select className={fieldStyles} value={review.reviewStatus} onChange={(e) => setReview({ ...review, reviewStatus: e.target.value as IdeaReview["reviewStatus"] })}>{reviewStates.map((state) => <option key={state}>{state}</option>)}</select></label>
        <label className="block">Private admin notes<Textarea rows={5} maxLength={10000} value={review.adminNotes} onChange={(e) => setReview({ ...review, adminNotes: e.target.value })} /></label>
        <h3 className="text-xl font-semibold">Edited public summary</h3><p className="text-sm leading-7 text-muted">Keep private details and email addresses out of the summary. Editing summary text resets approval and switches it to draft when saved.</p>
        {([['summaryTitle', 'Public title'], ['summaryBody', 'Public summary'], ['contributor', 'Contributor name (optional; separate consent required)']] as const).map(([key, label]) => <label key={key} className="block">{label}{key === "summaryBody" ? <Textarea rows={6} maxLength={10000} value={review[key]} onChange={(e) => setReview({ ...review, [key]: e.target.value, approved: false, publicationState: "draft" })} /> : <Input maxLength={200} disabled={key === "contributor" && !selected.attributionConsent} value={review[key]} onChange={(e) => setReview({ ...review, [key]: e.target.value, approved: false, publicationState: "draft" })} />}</label>)}
        <label className="flex gap-3"><input type="checkbox" disabled={!selected.publicationConsent} checked={review.approved} onChange={(e) => setReview({ ...review, approved: e.target.checked, publicationState: e.target.checked ? review.publicationState : "draft" })} /><span>I have reviewed and explicitly approve this edited public summary.</span></label>
        {!selected.publicationConsent && <p className="text-sm text-muted">Publication is unavailable because the sender did not consent.</p>}
        <div className="flex flex-wrap gap-3"><Button type="submit">Save review</Button><Button variant="secondary" onClick={() => setPreview(!preview)}>Preview summary</Button><Button disabled={!selected.publicationConsent || !review.approved || !review.summaryTitle.trim() || !review.summaryBody.trim()} onClick={() => { if (window.confirm("Publish this approved edited summary publicly?")) void run(() => save("published")); }}>Publish summary</Button><Button variant="secondary" onClick={() => run(() => save("draft"))}>Unpublish / save draft</Button></div>
      </fieldset></form>
      {preview && <article className="space-y-4 rounded-xl border border-accent/30 p-5"><p className="text-xs uppercase text-accent">Preview only — not publication</p><h3 className="text-2xl font-semibold">{review.summaryTitle || "Add a public title"}</h3><p className="whitespace-pre-line break-words leading-8 text-muted">{review.summaryBody || "Add an edited public summary."}</p>{selected.attributionConsent && review.contributor && <p>Contributor: {review.contributor}</p>}</article>}
      <div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>Close review</Button><Button variant="secondary" disabled={busy} onClick={() => { if (window.confirm(`Permanently delete "${selected.title}" and its public summary?`)) void run(async () => { await json(`/api/admin/ideas/${selected.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedUpdatedAt: selected.updatedAt }) }); setSelected(null); await load(page.page); router.refresh(); setNotice("Idea and summary deleted."); }); }}>Delete submission</Button></div>
    </section>}
  </div>;
}
