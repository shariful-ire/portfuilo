"use client";
import { useEffect, useRef, useState } from "react";
import { ideaCategories, ideaInputSchema, type IdeaInput } from "@/lib/ideas/schema";
import { Input, fieldStyles } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

type FormData = Omit<IdeaInput, "storageConsent"> & { storageConsent: boolean };
const empty: FormData = { name: "", email: "", organization: "", title: "", category: "Web Development", description: "", problem: "", collaboration: "", referenceUrl: "", timeline: "", storageConsent: false, publicationConsent: false, attributionConsent: false };
export function IdeaForm() {
  const [data, setData] = useState(empty); const [token, setToken] = useState(""); const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [issues, setIssues] = useState<Record<string, string>>({});
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/contact/token", { method: "POST", cache: "no-store", signal: abort.signal }).then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.message); setToken(body.token); }).catch((e) => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : "Form unavailable."); });
    return () => abort.abort();
  }, []);
  async function refresh() {
    setRefreshing(true); setError(""); setSuccess(""); setToken("");
    try { const r = await fetch("/api/contact/token", { method: "POST", cache: "no-store" }); const body = await r.json(); if (!r.ok) throw new Error(body.message); setToken(body.token); }
    catch (e) { setError(e instanceof Error ? e.message : "Form unavailable."); } finally { setRefreshing(false); }
  }
  return <form className="mt-10 max-w-3xl space-y-6" onSubmit={async (event) => {
    event.preventDefault(); setError(""); setSuccess("");
    const parsed = ideaInputSchema.safeParse(data);
    if (!parsed.success) { setIssues(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]))); document.getElementById(`idea-${String(parsed.error.issues[0]?.path[0])}`)?.focus(); return; }
    setIssues({}); setBusy(true);
    try { const r = await fetch("/api/ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...parsed.data, website, token }) }); const body = await r.json(); if (!r.ok || body.saved !== true) throw new Error(body.message || "Submission could not be confirmed."); setSuccess(body.message); setData(empty); setToken(""); setWebsite(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Submission could not be confirmed. Avoid resending if it may have saved."); }
    finally { setBusy(false); requestAnimationFrame(() => feedback.current?.focus()); }
  }}>
    <noscript>Enable JavaScript to submit an idea, or use a configured contact link.</noscript>
    <fieldset disabled={busy || refreshing} className="grid gap-6 sm:grid-cols-2">
      {([['name', 'Name', 100, true], ['email', 'Email', 254, true], ['organization', 'Organization or university', 200, false], ['title', 'Idea title', 200, true], ['referenceUrl', 'Reference URL', 2000, false], ['timeline', 'Timeline', 300, false]] as const).map(([key, label, max, required]) => <div key={key}><label htmlFor={`idea-${key}`} className="mb-2 block text-sm">{label} {required ? "(required)" : "(optional)"}</label><Input id={`idea-${key}`} required={required} maxLength={max} type={key === "email" ? "email" : key === "referenceUrl" ? "url" : "text"} autoComplete={key === "name" || key === "email" ? key : "off"} value={data[key]} onChange={(e) => setData({ ...data, [key]: e.target.value })} aria-invalid={!!issues[key]} aria-describedby={issues[key] ? `idea-error-${key}` : undefined} />{issues[key] && <p id={`idea-error-${key}`} className="mt-2 text-sm text-red-300">{issues[key]}</p>}</div>)}
      <label className="block text-sm sm:col-span-2">Category<select className={fieldStyles} value={data.category} onChange={(e) => setData({ ...data, category: e.target.value as IdeaInput["category"] })}>{ideaCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
      {([['description', 'Describe your idea', 20, 10000], ['problem', 'What problem does it address?', 10, 5000], ['collaboration', 'What collaboration or help do you need?', 10, 5000]] as const).map(([key, label, min, max]) => <div key={key} className="sm:col-span-2"><label htmlFor={`idea-${key}`} className="mb-2 block text-sm">{label} (required, {min}–{max} characters)</label><Textarea id={`idea-${key}`} required minLength={min} maxLength={max} rows={5} value={data[key]} onChange={(e) => setData({ ...data, [key]: e.target.value })} aria-invalid={!!issues[key]} aria-describedby={issues[key] ? `idea-error-${key}` : undefined} />{issues[key] && <p id={`idea-error-${key}`} className="mt-2 text-sm text-red-300">{issues[key]}</p>}</div>)}
      <div className="space-y-4 rounded-xl border border-border p-5 sm:col-span-2">
        <p id="idea-privacy" className="text-sm leading-7 text-muted">Submissions are reviewed privately. Your idea will not appear publicly unless you allow publication and it is approved. Your email and the raw submission are never part of the public summary.</p>
        <label className="flex items-start gap-3"><input id="idea-storageConsent" type="checkbox" required checked={data.storageConsent} onChange={(e) => setData({ ...data, storageConsent: e.target.checked })} aria-describedby="idea-privacy" className="mt-1" /><span>I consent to storing this submission and being contacted about it. (required)</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" checked={data.publicationConsent} onChange={(e) => setData({ ...data, publicationConsent: e.target.checked, attributionConsent: e.target.checked && data.attributionConsent })} className="mt-1" /><span>I allow an edited summary to be published after approval. (optional)</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" disabled={!data.publicationConsent} checked={data.attributionConsent} onChange={(e) => setData({ ...data, attributionConsent: e.target.checked })} className="mt-1" /><span>I also allow my name to appear as a contributor on that summary. (optional)</span></label>
        {issues.storageConsent && <p className="text-sm text-red-300">{issues.storageConsent}</p>}
      </div>
      <div hidden aria-hidden="true"><label htmlFor="idea-website">Leave empty</label><input id="idea-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
    </fieldset>
    <p ref={feedback} tabIndex={-1} role={error ? "alert" : "status"} className={error ? "text-red-300" : "text-sm text-accent"}>{error || success || (token ? "Ready. Review your idea and consent choices before submitting." : "Preparing form access...")}</p>
    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy || refreshing || !token}>{busy ? "Saving..." : "Submit for private review"}</Button><Button variant="secondary" disabled={busy || refreshing} onClick={refresh}>{refreshing ? "Refreshing..." : success ? "Start another idea" : "Refresh form access"}</Button></div>
  </form>;
}
