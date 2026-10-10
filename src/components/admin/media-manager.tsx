"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadInputSchema } from "@/lib/media/policy";
import type { MediaItem } from "@/lib/media/list";

export function MediaManager({ items, onChange, configured, disabled, onBusy }: { items: MediaItem[]; onChange: (items: MediaItem[]) => void; configured: boolean; disabled: boolean; onBusy: (busy: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function refresh() {
    const response = await fetch("/api/admin/media", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not refresh the media list. Reload the page to see upload status.");
    onChange(await response.json());
  }
  function start() { setBusy(true); onBusy(true); setError(""); setMessage(""); }
  function finish() { setBusy(false); onBusy(false); }
  async function upload() {
    if (!file) return;
    start(); setProgress(0);
    try {
      const input = uploadInputSchema.safeParse({ name: file.name, mime: file.type, size: file.size, alt });
      if (!input.success) throw new Error(input.error.issues.map((issue) => issue.message).join(" "));
      const signed = await fetch("/api/admin/media/signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.data) });
      const ticket = await signed.json();
      if (!signed.ok) throw new Error(ticket.message || "Upload authorization failed.");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", `/api/admin/media/${ticket.id}`);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.setRequestHeader("X-Upload-Signature", ticket.signature);
        xhr.timeout = 120_000;
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
        xhr.onerror = () => reject(new Error("Network error. Check the upload list before retrying."));
        xhr.ontimeout = () => reject(new Error("Upload timed out. Its server record is retained; refresh the list before retrying."));
        xhr.onload = () => {
          let result; try { result = JSON.parse(xhr.responseText); } catch { reject(new Error("Upload failed. The server or hosting provider rejected the request.")); return; }
          if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(result.message || "Upload failed."));
        };
        xhr.send(file);
      });
      setMessage("Uploaded and stored. Select this asset below, then save settings to publish it.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Upload failed."); }
    finally { try { await refresh(); } catch (failure) { setError(failure instanceof Error ? failure.message : "Refresh failed."); } finish(); }
  }
  async function remove(id: string) {
    if (!window.confirm("Permanently delete this asset from Cloudinary? Saved references must be removed first.")) return;
    start();
    try {
      const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Deletion failed; refresh and retry.");
      setMessage("Asset deleted.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Deletion failed."); }
    finally { try { await refresh(); } catch { setError("Refresh failed. Reload the page to verify deletion status."); } finish(); }
  }
  return <section aria-labelledby="media-title" className="space-y-5 rounded-2xl border border-border p-6">
    <h2 id="media-title" className="text-xl font-semibold">Media uploads</h2>
    {!configured && <p role="status" className="text-amber-200">Uploads are unavailable. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the server environment and restart.</p>}
    <p className="text-sm leading-6 text-muted">JPEG, PNG, or WebP up to 5 MiB; PDF up to 10 MiB. Files are intended for public use. Replacing a selection keeps the old asset until you explicitly delete it.</p>
    <fieldset disabled={!configured || busy || disabled} className="space-y-4 disabled:opacity-60">
      <div><label htmlFor="media-file" className="mb-2 block text-sm">File</label><Input id="media-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => {
        const selected = event.target.files?.[0] ?? null;
        setMessage(""); setError("");
        if (selected) {
          const checked = uploadInputSchema.safeParse({ name: selected.name, mime: selected.type, size: selected.size, alt: "Preview" });
          if (!checked.success) { setFile(null); setPreview(""); setError(checked.error.issues.map((issue) => issue.message).join(" ")); return; }
        }
        setFile(selected); setPreview(selected ? URL.createObjectURL(selected) : "");
      }} /></div>
      <div><label htmlFor="media-alt" className="mb-2 block text-sm">Image description (required for images)</label><Input id="media-alt" value={alt} maxLength={500} onChange={(event) => setAlt(event.target.value)} /></div>
      {file && preview && (file.type.startsWith("image/") ? <Image unoptimized src={preview} alt={alt || "Selected file preview"} width={240} height={160} className="max-h-48 rounded-lg object-contain" /> : <a href={preview} download={file.name} className="text-accent">Preview PDF: {file.name} ({Math.ceil(file.size / 1024)} KiB)</a>)}
      <Button disabled={!file} onClick={upload}>Upload file</Button>
    </fieldset>
    {busy && <div role="status"><progress value={progress} max={100} className="w-full" aria-label="File transfer progress" /><p className="mt-2 text-sm">{progress === 100 ? "Transfer complete. Processing and saving…" : "Operation in progress…"}</p></div>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}{message && <p role="status" className="text-sm text-accent">{message}</p>}
    <Button variant="secondary" disabled={busy || disabled} onClick={async () => { try { await refresh(); setError(""); } catch { setError("Could not refresh media. Reload the page."); } }}>Refresh media list</Button>
    <ul className="space-y-3">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"><div className="min-w-0"><p className="break-all text-sm">{item.name}</p><p className="mt-1 text-xs text-muted">{item.kind} · {item.state}</p>{item.url && item.state === "ready" && <a className="text-sm text-accent" href={item.url} target="_blank" rel="noopener noreferrer">View file</a>}</div><Button variant="secondary" disabled={!configured || busy || disabled} onClick={() => remove(item.id)}>{item.state === "deleting" ? "Retry deletion" : "Delete"}</Button></li>)}</ul>
    {items.length === 0 && <p className="text-sm text-muted">No uploads yet.</p>}
  </section>;
}
