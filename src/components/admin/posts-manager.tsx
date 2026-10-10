"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, fieldStyles } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaManager } from "./media-manager";
import { PostArticle } from "@/components/posts/post-article";
import { readingMinutes } from "@/lib/posts/markdown";
import { postInputSchema, emptyPost, type AdminPost, type PostInput } from "@/lib/posts/schema";
import type { MediaItem } from "@/lib/media/list";

export function PostsManager({ initial, initialMedia, configured }: { initial: AdminPost[]; initialMedia: MediaItem[]; configured: boolean }) {
  const [records, setRecords] = useState(initial);
  const [media, setMedia] = useState(initialMedia);
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PostInput>({ ...emptyPost });
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const editorTitle = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  async function reload() {
    const response = await fetch("/api/admin/posts", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not reload posts. Reload this page before making more changes.");
    setRecords(await response.json());
  }
  async function mutate(path: string, method: string, body: unknown, success: string, after?: () => void, focusId?: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Post could not be saved.");
      after?.(); await reload(); setMessage(success); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Operation failed."); }
    finally { setBusy(false); if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus()); }
  }
  function edit(record: AdminPost | null) {
    setEditing(record); setData(record ? { ...record.data } : { ...emptyPost });
    setOpen(true); setPreview(false); setError(""); setMessage("");
    requestAnimationFrame(() => { editorTitle.current?.scrollIntoView({ block: "start" }); titleInput.current?.focus(); });
  }
  const locked = busy || mediaBusy;
  const image = media.find((item) => item.id === data.coverMediaId && item.state === "ready" && item.kind === "image");
  return <div className="space-y-8">
    <p className="text-sm leading-7 text-muted">Drafts are visible only here. Publishing makes a post appear on the public listing and, by publication date, the homepage. Removing a post keeps its uploads for separate cleanup.</p>
    {error && <p role="alert" className="whitespace-pre-line text-sm text-red-300">{error}</p>}{message && <p role="status" aria-live="polite" className="text-sm text-accent">{message}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={locked || open} onClick={() => edit(null)}>Add post</Button><Button variant="secondary" disabled={locked || open} onClick={async () => { setBusy(true); try { await reload(); setError(""); } catch { setError("Could not refresh posts. Reload the page."); } finally { setBusy(false); } }}>Refresh list</Button></div>
    <ol aria-label="Saved posts" className="space-y-4">{records.map((record) => <li key={record.id} id={`post-row-${record.id}`} tabIndex={-1} className="rounded-xl border border-border p-5"><div className="mb-4"><h2 className="font-semibold">{record.data.title}</h2><p className="mt-1 text-sm text-muted">{record.data.publishedOn || "Undated"} · {record.data.status} · {record.data.tags.join(", ")}</p></div><div className="flex flex-wrap gap-2">
      <Button variant="secondary" disabled={locked || open} onClick={() => edit(record)}>Edit / preview</Button>
      <Button variant="secondary" disabled={locked || open} onClick={() => mutate(`/api/admin/posts/${record.id}`, "PATCH", { status: record.data.status === "draft" ? "published" : "draft", expectedUpdatedAt: record.updatedAt }, record.data.status === "draft" ? "Post published." : "Post unpublished.")}>{record.data.status === "draft" ? "Publish" : "Unpublish"}</Button>
      <Button variant="secondary" disabled={locked || open} onClick={() => { if (window.confirm(`Delete “${record.data.title}”? This removes the post permanently. Uploaded files will be retained.`)) void mutate(`/api/admin/posts/${record.id}`, "DELETE", { expectedUpdatedAt: record.updatedAt }, "Post deleted; media retained."); }}>Delete</Button>
    </div></li>)}</ol>
    {records.length === 0 && <p className="text-muted">No posts saved yet.</p>}
    {open && <section className="space-y-6 border-t border-border pt-8" aria-labelledby="post-editor"><h2 ref={editorTitle} id="post-editor" className="text-2xl font-semibold">{editing ? "Edit post" : "Add post"}</h2>
      <MediaManager items={media} onChange={setMedia} configured={configured} disabled={busy} onBusy={setMediaBusy} />
      <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); const parsed = postInputSchema.safeParse({ ...data, tags: data.tags.map((tag) => tag.trim()).filter(Boolean) }); if (!parsed.success) { setError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")); return; } void mutate(editing ? `/api/admin/posts/${editing.id}` : "/api/admin/posts", editing ? "PUT" : "POST", editing ? { data: parsed.data, expectedUpdatedAt: editing.updatedAt } : parsed.data, parsed.data.status === "draft" ? "Draft saved." : "Post saved and published.", () => { setOpen(false); setEditing(null); setPreview(false); }); }}>
        <fieldset disabled={locked} className="grid gap-5 sm:grid-cols-2">
          {([['title', 'Title'], ['slug', 'Unique slug'], ['coverAlt', 'Cover alt text'], ['seoTitle', 'SEO title (optional)']] as const).map(([key, label]) => <div key={key}><label htmlFor={`post-${key}`} className="mb-2 block text-sm">{label}</label><input ref={key === 'title' ? titleInput : undefined} id={`post-${key}`} className={fieldStyles} required={key !== 'seoTitle'} maxLength={key === 'slug' ? 120 : key === 'coverAlt' ? 500 : 200} value={data[key]} onChange={(event) => setData({ ...data, [key]: event.target.value })} /></div>)}
          <p className="text-sm text-muted sm:col-span-2">Use lowercase letters, numbers, and hyphens for the slug. Changing it changes the public URL. SEO fields fall back to the title and excerpt.</p>
          {([['excerpt', 'Excerpt'], ['markdown', 'Markdown body'], ['seoDescription', 'SEO description (optional)']] as const).map(([key, label]) => <div key={key} className="sm:col-span-2"><label htmlFor={`post-${key}`} className="mb-2 block text-sm">{label}</label><Textarea id={`post-${key}`} required={key !== 'seoDescription'} rows={key === 'markdown' ? 18 : 4} maxLength={key === 'markdown' ? 100000 : 500} value={data[key]} onChange={(event) => setData({ ...data, [key]: event.target.value })} /></div>)}
          <p className="text-sm text-muted sm:col-span-2">Markdown supports headings, lists, links, quotes, emphasis, and fenced code blocks. Code is displayed as text. HTML and inline images are disabled; select an uploaded cover below.</p>
          <div><label htmlFor="post-tags" className="mb-2 block text-sm">Tags (one per line)</label><Textarea id="post-tags" value={data.tags.join('\n')} onChange={(event) => setData({ ...data, tags: event.target.value.split('\n') })} /></div>
          <div><label htmlFor="post-cover" className="mb-2 block text-sm">Cover image</label><select id="post-cover" required className={fieldStyles} value={data.coverMediaId} onChange={(event) => setData({ ...data, coverMediaId: event.target.value })}><option value="">Select an uploaded image</option>{data.coverMediaId && !media.some((item) => item.id === data.coverMediaId && item.state === 'ready') && <option value={data.coverMediaId}>Current image unavailable</option>}{media.filter((item) => item.state === 'ready' && item.kind === 'image').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div><label htmlFor="post-date" className="mb-2 block text-sm">Publication date (UTC)</label><Input id="post-date" type="date" value={data.publishedOn} onChange={(event) => setData({ ...data, publishedOn: event.target.value })} /><p className="mt-2 text-sm text-muted">Leave blank to use the date of publication. Future dates cannot be published.</p></div>
          <div><label htmlFor="post-status" className="mb-2 block text-sm">Status</label><select id="post-status" className={fieldStyles} value={data.status} onChange={(event) => setData({ ...data, status: event.target.value as 'draft' | 'published' })}><option value="draft">Draft</option><option value="published">Published</option></select></div>
        </fieldset>
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={locked}>{busy ? "Saving…" : "Save post"}</Button><Button variant="secondary" disabled={locked} onClick={() => setPreview(!preview)}>{preview ? "Hide preview" : "Preview changes"}</Button><Button variant="secondary" disabled={locked} onClick={() => { if (window.confirm("Discard changes in this editor? Completed uploads will be retained.")) { setOpen(false); setEditing(null); setPreview(false); } }}>Cancel editing</Button></div>
      </form>
      {preview && <div className="rounded-xl border border-border p-6"><p className="mb-8 text-sm text-accent">Unsaved dashboard preview - not public</p><PostArticle preview post={{ id: editing?.id ?? 'preview', ...data, tags: data.tags.filter(Boolean), updatedAt: editing?.updatedAt ?? '', cover: image?.url ? { url: image.url, alt: data.coverAlt } : undefined, readingMinutes: readingMinutes(data.markdown) }} /></div>}
    </section>}
  </div>;
}
