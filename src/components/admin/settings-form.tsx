"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, fieldStyles } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { settingsInputSchema, type SettingsInput } from "@/lib/settings/schema";
import type { MediaItem } from "@/lib/media/list";
import { MediaManager } from "./media-manager";

const fields: { key: keyof SettingsInput; label: string; multiline?: boolean; required?: boolean }[] = [
  { key: "name", label: "Full name", required: true }, { key: "shortName", label: "Short name", required: true },
  { key: "headline", label: "Headline", required: true }, { key: "introduction", label: "Introduction", multiline: true, required: true }, { key: "biography", label: "Biography", multiline: true },
  { key: "university", label: "University" }, { key: "degree", label: "Degree wording" }, { key: "department", label: "Department wording" },
  { key: "city", label: "City" }, { key: "country", label: "Country" }, { key: "publicEmail", label: "Public contact email" },
  { key: "whatsapp", label: "WhatsApp number (+country code)" }, { key: "telegram", label: "Telegram username (@ optional)" },
  { key: "github", label: "GitHub profile/repository HTTPS URL" }, { key: "linkedin", label: "LinkedIn profile HTTPS URL" }, { key: "availability", label: "Availability (leave empty to hide)" },
  { key: "siteTitle", label: "Site title", required: true }, { key: "siteDescription", label: "Site description", multiline: true, required: true },
];
export function SettingsForm({ initial, initialMedia, cloudinaryConfigured }: { initial: SettingsInput; initialMedia: MediaItem[]; cloudinaryConfigured: boolean }) {
  const [data, setData] = useState(initial);
  const [media, setMedia] = useState(initialMedia);
  const [saving, setSaving] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  return <div className="space-y-8"><MediaManager items={media} onChange={setMedia} configured={cloudinaryConfigured} disabled={saving} onBusy={setMediaBusy} /><form className="space-y-6" onSubmit={async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    const parsed = settingsInputSchema.safeParse(data);
    if (!parsed.success) { setError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Settings were not saved.");
      setMessage("Settings saved and published."); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Settings were not saved."); }
    finally { setSaving(false); }
  }}>
    <h2 className="text-xl font-semibold">Profile and site settings</h2><p className="text-sm leading-6 text-muted">Saving publishes these settings. Empty optional fields are hidden publicly. Administrator access is configured separately on the server.</p>
    <fieldset disabled={saving || mediaBusy} className="grid gap-6 sm:grid-cols-2">
      {fields.map(({ key, label, multiline, required }) => <div key={key} className={multiline ? "sm:col-span-2" : ""}><label htmlFor={key} className="mb-2 block text-sm">{label}{required ? " *" : ""}</label>{multiline ? <Textarea id={key} name={key} required={required} value={data[key]} onChange={(event) => setData({ ...data, [key]: event.target.value })} /> : <Input id={key} name={key} required={required} value={data[key]} onChange={(event) => setData({ ...data, [key]: event.target.value })} />}</div>)}
      {([{ key: "photoMediaId", label: "Profile image", kind: "image" }, { key: "cvMediaId", label: "CV PDF", kind: "document" }, { key: "sharingMediaId", label: "Social sharing image", kind: "image" }] as const).map(({ key, label, kind }) => <div key={key}><label htmlFor={key} className="mb-2 block text-sm">{label}</label><select id={key} value={data[key]} className={fieldStyles} onChange={(event) => setData({ ...data, [key]: event.target.value })}><option value="">None (hide publicly)</option>{data[key] && !media.some((item) => item.id === data[key] && item.state === "ready") && <option value={data[key]}>Current selection unavailable — choose another</option>}{media.filter((item) => item.state === "ready" && item.kind === kind).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>)}
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}{message && <p role="status" className="text-sm text-accent">{message}</p>}
    <Button type="submit" disabled={saving || mediaBusy}>{saving ? "Saving…" : "Save and publish settings"}</Button>
  </form></div>;
}
