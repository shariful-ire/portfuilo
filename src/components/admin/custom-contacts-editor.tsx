"use client";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CustomContactsEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const links: { title: string; url: string }[] = JSON.parse(value || "[]");
  const change = (next: typeof links) => onChange(JSON.stringify(next));
  return <fieldset className="space-y-5 rounded-2xl border border-border p-5 sm:col-span-2">
    <legend className="px-2 text-xl font-semibold">Additional contact links</legend>
    <p className="text-sm leading-6 text-muted">Add any website or app profile with a title and HTTPS link. These appear in Contact and the footer after you save settings. Links without https:// are normalized automatically. Use the existing email, WhatsApp and Telegram fields for messaging actions.</p>
    {links.map((link, index) => <div key={index} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
      <div><label htmlFor={`${id}-title-${index}`} className="mb-2 block text-sm">Title {index + 1}</label><Input id={`${id}-title-${index}`} required maxLength={80} value={link.title} placeholder="Facebook" onChange={(e) => change(links.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} /></div>
      <div><label htmlFor={`${id}-url-${index}`} className="mb-2 block text-sm">Link {index + 1}</label><Input id={`${id}-url-${index}`} required maxLength={2000} inputMode="url" value={link.url} placeholder="https://www.facebook.com/your-profile" onChange={(e) => change(links.map((item, i) => i === index ? { ...item, url: e.target.value } : item))} /></div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">{[-1, 1].map((direction) => <Button key={direction} variant="secondary" disabled={index + direction < 0 || index + direction >= links.length} aria-label={`Move contact ${index + 1} ${direction < 0 ? "up" : "down"}`} onClick={() => { const next = [...links]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; change(next); }}>{direction < 0 ? "Move up" : "Move down"}</Button>)}<Button variant="secondary" aria-label={`Remove contact ${index + 1}`} onClick={() => change(links.filter((_, i) => i !== index))}>Remove</Button></div>
    </div>)}
    <Button variant="secondary" disabled={links.length >= 30} onClick={() => change([...links, { title: "", url: "" }])}>Add contact link</Button>
    <p className="text-xs text-muted">Changes, including removals and order, take effect when you save settings below.</p>
  </fieldset>;
}
