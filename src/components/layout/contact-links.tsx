import type { SettingsInput } from "@/lib/settings/schema";
import { contactActions, whatsappValue } from "@/lib/contact/links";
export function ContactLinks({ data }: { data: SettingsInput }) {
 const links = contactActions(data);
 const phone = whatsappValue.safeParse(data.whatsapp);
 return <div className="flex flex-wrap gap-3">{phone.success && <a href={`tel:${phone.data}`} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent hover:border-accent" aria-label={`Call ${phone.data}`}>{phone.data}</a>}{links.map((link) => <a key={link.channel} href={link.href} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent hover:border-accent" aria-label={link.channel === "github" ? "GitHub profile or repository" : link.label}>{link.label}</a>)}</div>;
}
