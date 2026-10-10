"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, fieldStyles } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaManager } from "./media-manager";
import { ProjectCard } from "@/components/projects/project-card";
import { projectInputSchema, emptyProject, type AdminProject, type ProjectInput } from "@/lib/projects/schema";
import type { MediaItem } from "@/lib/media/list";

export function ProjectsManager({ initial, initialMedia, configured }: { initial: AdminProject[]; initialMedia: MediaItem[]; configured: boolean }) {
  const [records, setRecords] = useState(initial);
  const [media, setMedia] = useState(initialMedia);
  const [editing, setEditing] = useState<AdminProject | null>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ProjectInput>({ ...emptyProject });
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const editorTitle = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  async function reload() {
    const response = await fetch("/api/admin/projects", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not reload projects. Reload this page before making more changes.");
    setRecords(await response.json());
  }
  async function mutate(path: string, method: string, body: unknown, success: string, after?: () => void, focusId?: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Project could not be saved.");
      after?.(); await reload(); setMessage(success); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Operation failed."); }
    finally { setBusy(false); if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus()); }
  }
  function edit(record: AdminProject | null) {
    setEditing(record); setData(record ? { ...record.data } : { ...emptyProject, displayOrder: Math.min(1_000_000, records.reduce((max, item) => Math.max(max, item.data.displayOrder), -1) + 1) });
    setOpen(true); setPreview(false); setError(""); setMessage("");
    requestAnimationFrame(() => { editorTitle.current?.scrollIntoView({ block: "start" }); titleInput.current?.focus(); });
  }
  const locked = busy || mediaBusy;
  const image = media.find((item) => item.id === data.thumbnailId && item.state === "ready" && item.kind === "image");
  return <div className="space-y-8">
    <p className="text-sm leading-7 text-muted">Drafts are visible only here. Publishing makes a project appear on the public listing and, when featured, the homepage. Removing a project keeps its uploads for separate cleanup.</p>
    {error && <p role="alert" className="whitespace-pre-line text-sm text-red-300">{error}</p>}{message && <p role="status" aria-live="polite" className="text-sm text-accent">{message}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={locked || open} onClick={() => edit(null)}>Add project</Button><Button variant="secondary" disabled={locked || open} onClick={async () => { setBusy(true); try { await reload(); setError(""); } catch { setError("Could not refresh projects. Reload the page."); } finally { setBusy(false); } }}>Refresh list</Button></div>
    <ol aria-label="Projects in display order" className="space-y-4">{records.map((record) => <li key={record.id} id={`project-row-${record.id}`} tabIndex={-1} className="rounded-xl border border-border p-5"><div className="mb-4"><h2 className="font-semibold">{record.data.title}</h2><p className="mt-1 text-sm text-muted">{record.data.category} · {record.data.status} · Order {record.data.displayOrder}</p></div><div className="flex flex-wrap gap-2">
      <Button variant="secondary" disabled={locked || open} onClick={() => edit(record)}>Edit / preview</Button>
      <Button variant="secondary" disabled={locked || open} onClick={() => mutate(`/api/admin/projects/${record.id}`, "PATCH", { status: record.data.status === "draft" ? "published" : "draft", expectedUpdatedAt: record.updatedAt }, record.data.status === "draft" ? "Project published." : "Project unpublished.")}>{record.data.status === "draft" ? "Publish" : "Unpublish"}</Button>
      <Button variant="secondary" disabled={locked || open} onClick={() => { if (window.confirm(`Delete “${record.data.title}”? This removes the project permanently. Uploaded files will be retained.`)) void mutate(`/api/admin/projects/${record.id}`, "DELETE", { expectedUpdatedAt: record.updatedAt }, "Project deleted; media retained."); }}>Delete</Button>
    </div></li>)}</ol>
    {records.length === 0 && <p className="text-muted">No projects saved yet.</p>}
    {open && <section className="space-y-6 border-t border-border pt-8" aria-labelledby="project-editor"><h2 ref={editorTitle} id="project-editor" className="text-2xl font-semibold">{editing ? "Edit project" : "Add project"}</h2>
      <MediaManager items={media} onChange={setMedia} configured={configured} disabled={busy} onBusy={setMediaBusy} />
      <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); const parsed = projectInputSchema.safeParse({ ...data, features: data.features.map((value) => value.trim()).filter(Boolean), technologies: data.technologies.map((value) => value.trim()).filter(Boolean) }); if (!parsed.success) { setError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")); return; } void mutate(editing ? `/api/admin/projects/${editing.id}` : "/api/admin/projects", editing ? "PUT" : "POST", editing ? { data: parsed.data, expectedUpdatedAt: editing.updatedAt } : parsed.data, parsed.data.status === "draft" ? "Draft saved." : "Project saved and published.", () => { setOpen(false); setEditing(null); setPreview(false); }); }}>
        <fieldset disabled={locked} className="grid gap-5 sm:grid-cols-2">
          {([['title', 'Title'], ['slug', 'Unique slug'], ['thumbnailAlt', 'Thumbnail alt text']] as const).map(([key, label]) => <div key={key}><label htmlFor={`project-${key}`} className="mb-2 block text-sm">{label} *</label><input className={fieldStyles} ref={key === 'title' ? titleInput : undefined} id={`project-${key}`} required maxLength={key === 'slug' ? 120 : key === 'title' ? 200 : 500} value={data[key]} onChange={(event) => setData({ ...data, [key]: event.target.value })} /></div>)}
          <p className="text-sm text-muted">Slugs use lowercase letters, numbers, and hyphens. Changing a slug changes its public URL.</p>
          {([['summary', 'Summary'], ['description', 'Detailed description'], ['problem', 'Problem'], ['solution', 'Solution'], ['contribution', 'My contribution'], ['challenges', 'Challenges (optional)'], ['lessons', 'Lessons learned (optional)']] as const).map(([key, label]) => <div key={key} className="sm:col-span-2"><label htmlFor={`project-${key}`} className="mb-2 block text-sm">{label}</label><Textarea id={`project-${key}`} required={key !== 'challenges' && key !== 'lessons'} maxLength={key === 'summary' ? 500 : 5000} value={data[key]} onChange={(event) => setData({ ...data, [key]: event.target.value })} /></div>)}
          {([['features', 'Features (one per line)'], ['technologies', 'Technology tags (one per line)']] as const).map(([key, label]) => <div key={key}><label htmlFor={`project-${key}`} className="mb-2 block text-sm">{label}</label><Textarea id={`project-${key}`} value={data[key].join('\n')} onChange={(event) => setData({ ...data, [key]: event.target.value.split('\n') })} /></div>)}
          <div><label htmlFor="project-thumbnail" className="mb-2 block text-sm">Thumbnail *</label><select id="project-thumbnail" required className={fieldStyles} value={data.thumbnailId} onChange={(event) => setData({ ...data, thumbnailId: event.target.value })}><option value="">Select an uploaded image</option>{data.thumbnailId && !media.some((item) => item.id === data.thumbnailId && item.state === 'ready') && <option value={data.thumbnailId}>Current image unavailable</option>}{media.filter((item) => item.state === 'ready' && item.kind === 'image').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div><label htmlFor="project-category" className="mb-2 block text-sm">Category</label><select id="project-category" className={fieldStyles} value={data.category} onChange={(event) => setData({ ...data, category: event.target.value as ProjectInput['category'] })}>{['Web', 'IoT', 'Robotics', 'Other'].map((category) => <option key={category}>{category}</option>)}</select></div>
          <div className="space-y-4 sm:col-span-2"><h3 className="font-semibold">Gallery (up to 20 images)</h3>{data.gallery.map((item, index) => <div key={index} className="space-y-3 rounded-lg border border-border p-4"><label htmlFor={`gallery-image-${index}`} className="block text-sm">Image {index + 1}</label><select id={`gallery-image-${index}`} required className={fieldStyles} value={item.mediaId} onChange={(event) => setData({ ...data, gallery: data.gallery.map((entry, i) => i === index ? { ...entry, mediaId: event.target.value } : entry) })}><option value="">Select image</option>{item.mediaId && !media.some((asset) => asset.id === item.mediaId && asset.state === 'ready') && <option value={item.mediaId}>Current image unavailable</option>}{media.filter((asset) => asset.state === 'ready' && asset.kind === 'image').map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select><label htmlFor={`gallery-alt-${index}`} className="block text-sm">Alt text for image {index + 1}</label><Input id={`gallery-alt-${index}`} required maxLength={500} value={item.alt} onChange={(event) => setData({ ...data, gallery: data.gallery.map((entry, i) => i === index ? { ...entry, alt: event.target.value } : entry) })} /><Button variant="secondary" onClick={() => setData({ ...data, gallery: data.gallery.filter((_, i) => i !== index) })}>Remove image {index + 1}</Button></div>)}<Button variant="secondary" disabled={data.gallery.length >= 20} onClick={() => setData({ ...data, gallery: [...data.gallery, { mediaId: '', alt: '' }] })}>Add gallery image</Button></div>
          {([['repositoryUrl', 'GitHub URL'], ['liveUrl', 'Live demo URL'], ['videoUrl', 'Video URL']] as const).map(([key, label]) => <div key={key}><label htmlFor={`project-${key}`} className="mb-2 block text-sm">{label} (optional)</label><Input id={`project-${key}`} type="url" maxLength={2000} value={data[key]} onChange={(event) => setData({ ...data, [key]: event.target.value })} /></div>)}
          <div><label htmlFor="project-order" className="mb-2 block text-sm">Display order</label><Input id="project-order" type="number" required min={0} max={1_000_000} step={1} value={data.displayOrder} onChange={(event) => setData({ ...data, displayOrder: Number(event.target.value) })} /></div>
          <div><label htmlFor="project-status" className="mb-2 block text-sm">Status</label><select id="project-status" className={fieldStyles} value={data.status} onChange={(event) => setData({ ...data, status: event.target.value as 'draft' | 'published' })}><option value="draft">Draft</option><option value="published">Published</option></select></div>
          <label className="flex items-center gap-3"><input type="checkbox" checked={data.featured} onChange={(event) => setData({ ...data, featured: event.target.checked })} />Featured on homepage</label>
        </fieldset>
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={locked}>{busy ? "Saving…" : "Save project"}</Button><Button variant="secondary" disabled={locked} onClick={() => setPreview(!preview)}>{preview ? "Hide preview" : "Preview changes"}</Button><Button variant="secondary" disabled={locked} onClick={() => { if (window.confirm("Discard changes in this editor? Completed uploads will be retained.")) { setOpen(false); setEditing(null); setPreview(false); } }}>Cancel editing</Button></div>
      </form>
      {preview && <div className="max-w-2xl"><p className="mb-4 text-sm text-accent">Unsaved dashboard preview — not public</p><ProjectCard preview project={{ id: editing?.id ?? "preview", ...data, thumbnail: image?.url ? { url: image.url, alt: data.thumbnailAlt } : undefined, gallery: [] }} />{!image && <p className="mt-3 text-sm text-muted">Select a completed image upload to preview it.</p>}</div>}
    </section>}
  </div>;
}
