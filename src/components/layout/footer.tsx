import Link from "next/link";
import { getPublicSettings } from "@/lib/settings/public";
import { configuredNavigation, parsePresentation } from "@/lib/settings/presentation";
import { ContactLinks } from "./contact-links";
import { PageContainer } from "./page-container";
export async function Footer() {
 const { data } = await getPublicSettings();
 const navigation = configuredNavigation(parsePresentation(data.presentationJson));
 return <footer className="border-t border-border bg-surface/60"><PageContainer className="py-12 sm:py-16">
 <div className="grid gap-10 md:grid-cols-[1.4fr_0.7fr_1fr]">
 <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Web / IoT / Robotics</p><h2 className="mt-4 max-w-sm text-3xl font-semibold leading-tight tracking-tight">Let&apos;s build something practical.</h2><p className="mt-5 text-sm text-muted">{data.name}{data.country ? ` / ${data.country}` : ""}</p>{data.availability && <p className="mt-3 text-sm leading-6 text-accent">{data.availability}</p>}</div>
 <nav aria-label="Footer"><h3 className="mb-4 text-sm font-semibold">Explore</h3><ul className="space-y-1">{navigation.map((item) => <li key={item.href}><Link href={item.href} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-accent">{item.label}</Link></li>)}</ul></nav>
 <div><h3 className="mb-5 text-sm font-semibold">Get in touch</h3><ContactLinks data={data} /><p className="mt-5 text-sm leading-6 text-muted">Have a question or an idea? <Link href="/#contact" className="text-accent underline underline-offset-4">Send a message.</Link></p></div>
 </div><div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted"><p>&copy; {new Date().getFullYear()} {data.name}</p><div className="flex flex-wrap gap-6"><Link href="/dashboard" className="inline-flex min-h-11 items-center hover:text-accent">Manage portfolio</Link><a href="#main-content" className="inline-flex min-h-11 items-center hover:text-accent">Back to top &uarr;</a></div></div>
 </PageContainer></footer>;
}
