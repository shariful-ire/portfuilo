"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, fieldStyles } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaManager } from "./media-manager";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { certificateInputSchema, emptyCertificate, type AdminCertificate, type CertificateInput } from "@/lib/certificates/schema";
import type { MediaItem } from "@/lib/media/list";

export function CertificatesManager({ initial, initialMedia, configured }: { initial: AdminCertificate[]; initialMedia: MediaItem[]; configured: boolean }) {
  const [records, setRecords] = useState(initial);
  const [media, setMedia] = useState(initialMedia);
  const [editing, setEditing] = useState<AdminCertificate | null>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CertificateInput>({ ...emptyCertificate });
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const editorTitle = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  async function reload() {
    const response = await fetch("/api/admin/certificates", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not reload certificates. Reload this page before making more changes.");
    setRecords(await response.json());
  }
  async function mutate(path: string, method: string, body: unknown, success: string, after?: () => void, focusId?: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Certificate could not be saved.");
      after?.(); await reload(); setMessage(success); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Operation failed."); }
    finally { setBusy(false); if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus()); }
  }
  function edit(record: AdminCertificate | null) {
    setEditing(record); setData(record ? { ...record.data } : { ...emptyCertificate, displayOrder: Math.min(1_000_000, records.reduce((max, item) => Math.max(max, item.data.displayOrder), -1) + 1) });
    setOpen(true); setPreview(false); setError(""); setMessage("");
    requestAnimationFrame(() => { editorTitle.current?.scrollIntoView({ block: "start" }); editorTitle.current?.focus({ preventScroll: true }); });
  }
  const locked = busy || mediaBusy;
  const image = media.find((item) => item.id === data.mediaId && item.state === "ready" && item.kind === "image");
  const pdf = media.find((item) => item.id === data.pdfMediaId && item.state === "ready" && item.kind === "document");
  return <div className="space-y-8">
    <p className="text-sm leading-7 text-muted">Drafts are visible only here. Publishing makes a certificate appear on the public listing and, by display order, the homepage. Removing a certificate keeps its uploads for separate cleanup.</p>
    {error && <p role="alert" className="whitespace-pre-line text-sm text-red-300">{error}</p>}{message && <p role="status" aria-live="polite" className="text-sm text-accent">{message}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={locked || open} onClick={() => edit(null)}>Add certificate</Button><Button variant="secondary" disabled={locked || open} onClick={async () => { setBusy(true); try { await reload(); setError(""); } catch { setError("Could not refresh certificates. Reload the page."); } finally { setBusy(false); } }}>Refresh list</Button></div>
    <ol aria-label="Certificates in display order" className="space-y-4">{records.map((record, index) => <li key={record.id} id={`certificate-row-${record.id}`} tabIndex={-1} className="rounded-xl border border-border p-5"><div className="mb-4"><h2 className="font-semibold">{record.data.title}</h2><p className="mt-1 text-sm text-muted">{record.data.issuer} · {record.data.status} · Order {record.data.displayOrder}</p></div><div className="flex flex-wrap gap-2">
      <Button variant="secondary" disabled={locked || open} onClick={() => edit(record)}>Edit / preview</Button>
      <Button variant="secondary" disabled={locked || open} onClick={() => mutate(`/api/admin/certificates/${record.id}`, "PATCH", { status: record.data.status === "draft" ? "published" : "draft", expectedUpdatedAt: record.updatedAt }, record.data.status === "draft" ? "Certificate published." : "Certificate unpublished.")}>{record.data.status === "draft" ? "Publish" : "Unpublish"}</Button>
      <Button variant="secondary" aria-label={`Move ${record.data.title} up`} disabled={locked || open || index === 0} onClick={() => mutate("/api/admin/certificates/reorder", "POST", { id: record.id, direction: "up" }, `${record.data.title} moved up.`, undefined, `certificate-row-${record.id}`)}>↑ Up</Button>
      <Button variant="secondary" aria-label={`Move ${record.data.title} down`} disabled={locked || open || index === records.length - 1} onClick={() => mutate("/api/admin/certificates/reorder", "POST", { id: record.id, direction: "down" }, `${record.data.title} moved down.`, undefined, `certificate-row-${record.id}`)}>↓ Down</Button>
      <Button variant="secondary" disabled={locked || open} onClick={() => { if (window.confirm(`Delete “${record.data.title}”? This removes the certificate permanently. Uploaded files will be retained.`)) void mutate(`/api/admin/certificates/${record.id}`, "DELETE", { expectedUpdatedAt: record.updatedAt }, "Certificate deleted; media retained."); }}>Delete</Button>
    </div></li>)}</ol>
    {records.length === 0 && <p className="text-muted">No certificates saved yet.</p>}
    {open && <section className="space-y-6 border-t border-border pt-8" aria-labelledby="certificate-editor"><h2 ref={editorTitle} tabIndex={-1} id="certificate-editor" className="scroll-mt-24 text-2xl font-semibold">{editing ? "Edit certificate" : "Add certificate"}</h2>
      <p className="text-sm text-muted">Upload your certificate image and optional PDF here, or choose an existing upload below. Successful uploads are selected automatically. Then complete the details and save.</p>
      <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); const parsed = certificateInputSchema.safeParse(data); if (!parsed.success) { setError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")); return; } void mutate(editing ? `/api/admin/certificates/${editing.id}` : "/api/admin/certificates", editing ? "PUT" : "POST", editing ? { data: parsed.data, expectedUpdatedAt: editing.updatedAt } : parsed.data, parsed.data.status === "draft" ? "Draft saved." : "Certificate saved and published.", () => { setOpen(false); setEditing(null); setPreview(false); }); }}>
        <fieldset disabled={locked} className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="cert-title" className="mb-2 block text-sm">Title *</label><input ref={titleInput} id="cert-title" required maxLength={200} className={fieldStyles} value={data.title} onChange={(event) => setData({ ...data, title: event.target.value })} /></div>
          <div><label htmlFor="cert-issuer" className="mb-2 block text-sm">Issuing organization *</label><Input id="cert-issuer" required maxLength={200} value={data.issuer} onChange={(event) => setData({ ...data, issuer: event.target.value })} /></div>
          {([{ key: "mediaId", label: "Certificate image *", kind: "image" }, { key: "pdfMediaId", label: "Optional PDF", kind: "document" }] as const).map(({ key, label, kind }) => <div key={key} className="min-w-0 space-y-4">
            <MediaManager items={media} onChange={setMedia} configured={configured} disabled={locked} onBusy={setMediaBusy} kind={kind} title={label} onUploaded={(item) => setData((current) => ({ ...current, [key]: item.id, ...(kind === "image" ? { imageAlt: item.alt } : {}) }))} />
            <label htmlFor={`cert-${key}`} className="mb-2 block text-sm">Or choose an already uploaded {kind === "image" ? "image" : "PDF"}</label><select id={`cert-${key}`} required={key === "mediaId"} className={fieldStyles} value={data[key]} onChange={(event) => setData({ ...data, [key]: event.target.value })}><option value="">{key === "mediaId" ? "Upload an image above or select an existing one" : "No PDF selected"}</option>{data[key] && !media.some((item) => item.id === data[key] && item.state === "ready") && <option value={data[key]}>Current asset (not in recent uploads)</option>}{media.filter((item) => item.state === "ready" && item.kind === kind).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>)}
          <div className="sm:col-span-2"><label htmlFor="cert-alt" className="mb-2 block text-sm">Image alt text *</label><Input id="cert-alt" required maxLength={500} value={data.imageAlt} onChange={(event) => setData({ ...data, imageAlt: event.target.value })} /></div>
          <div><label htmlFor="cert-date" className="mb-2 block text-sm">Issue date *</label><Input id="cert-date" type="date" required value={data.issuedOn} onChange={(event) => setData({ ...data, issuedOn: event.target.value })} /></div>
          <div><label htmlFor="cert-credential" className="mb-2 block text-sm">Credential ID (optional)</label><Input id="cert-credential" maxLength={200} value={data.credentialId} onChange={(event) => setData({ ...data, credentialId: event.target.value })} /></div>
          <div className="sm:col-span-2"><label htmlFor="cert-url" className="mb-2 block text-sm">Verification URL (optional)</label><Input id="cert-url" type="url" value={data.credentialUrl} onChange={(event) => setData({ ...data, credentialUrl: event.target.value })} /></div>
          <div className="sm:col-span-2"><label htmlFor="cert-description" className="mb-2 block text-sm">Description *</label><Textarea id="cert-description" required maxLength={10_000} value={data.description} onChange={(event) => setData({ ...data, description: event.target.value })} /></div>
          <div><label htmlFor="cert-category" className="mb-2 block text-sm">Category *</label><Input id="cert-category" required maxLength={100} value={data.category} onChange={(event) => setData({ ...data, category: event.target.value })} /></div>
          <div><label htmlFor="cert-order" className="mb-2 block text-sm">Display order *</label><Input id="cert-order" type="number" min={0} max={1_000_000} step={1} required value={data.displayOrder} onChange={(event) => setData({ ...data, displayOrder: Number(event.target.value) })} /></div>
          <div><label htmlFor="cert-status" className="mb-2 block text-sm">Status</label><select id="cert-status" className={fieldStyles} value={data.status} onChange={(event) => setData({ ...data, status: event.target.value as "draft" | "published" })}><option value="draft">Draft</option><option value="published">Published</option></select></div>
        </fieldset>
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={locked}>{busy ? "Saving…" : "Save certificate"}</Button><Button variant="secondary" disabled={locked} onClick={() => setPreview(!preview)}>{preview ? "Hide preview" : "Preview changes"}</Button><Button variant="secondary" disabled={locked} onClick={() => { if (window.confirm("Discard changes in this editor? Completed uploads will be retained.")) { setOpen(false); setEditing(null); setPreview(false); } }}>Cancel editing</Button></div>
      </form>
      {preview && <div className="max-w-2xl"><p className="mb-4 text-sm text-accent">Unsaved dashboard preview — not public</p><CertificateCard certificate={{ id: editing?.id ?? "preview", ...data, imageUrl: image?.url, pdfUrl: pdf?.url }} />{!image && <p className="mt-3 text-sm text-muted">Select a completed image upload to preview it.</p>}</div>}
    </section>}
  </div>;
}
