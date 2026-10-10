"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Input, fieldStyles } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { type Presentation } from "@/lib/settings/presentation";
import type { MediaItem } from "@/lib/media/list";

export function PresentationFields({ value, onChange, media, renderUpload }: { value: string; onChange: (value: string) => void; media: MediaItem[]; renderUpload: (key: "logoId" | "darkLogoId" | "lightLogoId" | "faviconId", label: string) => ReactNode }) {
  const data: Presentation = JSON.parse(value);
  const set = (patch: Partial<Presentation>) => onChange(JSON.stringify({ ...data, ...patch }));
  const pageChange = (index: number, patch: Partial<Presentation["pages"][number]>) => set({ pages: data.pages.map((page, i) => i === index ? { ...page, ...patch } : page) });
  return <div className="space-y-8 sm:col-span-2">
    <fieldset className="space-y-5 rounded-2xl border border-border p-5"><legend className="px-2 text-xl font-semibold">Branding</legend>
      <label className="block">Site name<Input value={data.siteName} maxLength={100} onChange={(e) => set({ siteName: e.target.value })} /></label>
      <label className="block">Logo alt text<Input value={data.logoAlt} maxLength={300} onChange={(e) => set({ logoAlt: e.target.value })} /></label>
      <p className="text-sm text-muted">Upload each asset below or choose an existing image. Dark theme uses the dark logo, then the primary logo. Favicon: square PNG, 32/48/96/180/192/512 pixels.</p>
      <div className="grid gap-5 sm:grid-cols-2">{([['logoId', 'Primary logo'], ['darkLogoId', 'Dark logo'], ['lightLogoId', 'Light logo (optional)'], ['faviconId', 'Favicon']] as const).map(([key, label]) => {
        const asset = media.find((item) => item.id === data[key]);
        return <div key={key} className="min-w-0 space-y-3">{renderUpload(key, label)}<label htmlFor={key}>{label}</label><select id={key} className={fieldStyles} value={data[key]} onChange={(e) => set({ [key]: e.target.value })}><option value="">None</option>{data[key] && !asset && <option value={data[key]}>Current asset unavailable</option>}{media.filter((item) => item.kind === "image" && item.state === "ready").map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>{asset?.url && <div className={`mt-3 rounded-xl p-4 ${key === "lightLogoId" ? "bg-white" : "bg-background"}`}><Image src={asset.url} alt={data.logoAlt || "Selected asset preview"} width={160} height={80} className="h-20 w-40 object-contain" /></div>}</div>;
      })}</div>
    </fieldset>
    <fieldset className="space-y-5 rounded-2xl border border-border p-5"><legend className="px-2 text-xl font-semibold">Appearance &amp; Motion</legend>
      <label className="flex gap-3"><input type="checkbox" checked={data.animations} onChange={(e) => set({ animations: e.target.checked })} />Enable decorative animations and 3D</label>
      <label className="block">Accent color<select className={fieldStyles} value={data.accent} onChange={(e) => set({ accent: e.target.value as Presentation["accent"] })}><option value="cyan">Cyan</option><option value="sky">Sky</option><option value="mint">Mint</option></select></label>
      <label className="block">Hero roles (one per line, up to five)<Textarea value={data.roles.join("\n")} onChange={(e) => set({ roles: e.target.value.split("\n") })} /></label>
      <p className="text-sm text-muted">An empty role list hides the subtitle. Visitor reduced-motion preferences always take priority.</p>
      <Button type="button" variant="secondary" onClick={() => set({ roles: data.roles.map((role) => role.trim()).filter(Boolean) })}>Remove empty role lines</Button>
    </fieldset>
    <fieldset className="space-y-5 rounded-2xl border border-border p-5"><legend className="px-2 text-xl font-semibold">Navigation &amp; Pages</legend>
      <p className="text-sm leading-6 text-muted">Disabled pages return 404, leave navigation and the sitemap, and hide related homepage sections. Authentication and dashboard routes are always retained. The About page supports structured text blocks; homepage About remains part of your profile.</p>
      {data.pages.map((page, index) => <details key={page.path} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium">{page.path} {page.enabled ? "" : "(disabled)"}</summary><div className="mt-5 space-y-4">
        <div className="flex flex-wrap gap-5"><label><input type="checkbox" checked={page.enabled} onChange={(e) => pageChange(index, { enabled: e.target.checked })} /> Enabled</label><label><input type="checkbox" checked={page.inNavigation} onChange={(e) => pageChange(index, { inNavigation: e.target.checked })} /> Show in navigation</label></div>
        {([['label', 'Navigation label'], ['title', 'Page title'], ['introduction', 'Introduction'], ['seoTitle', 'SEO title'], ['seoDescription', 'SEO description']] as const).map(([key, label]) => <label key={key} className="block">{label}<Input value={page[key]} onChange={(e) => pageChange(index, { [key]: e.target.value })} /></label>)}
        {page.path === "/about" && <div className="space-y-4">{page.blocks.map((block, i) => <div key={i} className="space-y-2 rounded border border-border p-3"><label className="block">Block {i + 1} heading<Input value={block.heading} onChange={(e) => pageChange(index, { blocks: page.blocks.map((b, j) => j === i ? { ...b, heading: e.target.value } : b) })} /></label><label className="block">Text (plain text)<Textarea value={block.text} onChange={(e) => pageChange(index, { blocks: page.blocks.map((b, j) => j === i ? { ...b, text: e.target.value } : b) })} /></label><Button type="button" variant="secondary" onClick={() => pageChange(index, { blocks: page.blocks.filter((_, j) => i !== j) })}>Remove block {i + 1}</Button></div>)}<Button type="button" variant="secondary" disabled={page.blocks.length >= 12} onClick={() => pageChange(index, { blocks: [...page.blocks, { heading: "", text: "" }] })}>Add text block</Button></div>}
        <div className="flex gap-3">{[-1, 1].map((direction) => <Button key={direction} type="button" variant="secondary" disabled={index + direction < 0 || index + direction >= data.pages.length} aria-label={`Move ${page.label} ${direction < 0 ? "up" : "down"}`} onClick={() => { const pages = [...data.pages]; [pages[index], pages[index + direction]] = [pages[index + direction], pages[index]]; set({ pages }); }}>{direction < 0 ? "Move up" : "Move down"}</Button>)}</div>
        <details><summary className="cursor-pointer text-accent">Preview page text</summary><div className="mt-4 space-y-4"><h2 className="text-2xl">{page.title}</h2><p>{page.introduction}</p>{page.path === "/about" && page.blocks.map((block, i) => <section key={i}><h3 className="text-xl">{block.heading}</h3><p className="whitespace-pre-line leading-7 text-muted">{block.text}</p></section>)}</div></details>
      </div></details>)}
    </fieldset>
  </div>;
}
