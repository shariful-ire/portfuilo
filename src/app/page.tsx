import {HomeProducts} from "@/components/products/home-products";
import { SectionHeading } from "@/components/ui/section-heading";
import { WebPreview } from "@/components/hero/web-preview";
import { getPresentation } from "@/lib/settings/pages";
import { HeroHeading } from "@/components/hero/hero-heading";
import { publicMetadata } from "@/lib/seo/metadata";
import { HeroRobot } from "@/components/hero/hero-robot";
import { ContactForm } from "@/components/contact/contact-form";
import { contactActions } from "@/lib/contact/links";
import { HomeSections } from "@/components/home-sections/home-sections";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { getPublicSettings } from "@/lib/settings/public";
import { ContactLinks } from "@/components/layout/contact-links";
import { AdminToolbar } from "@/components/auth/admin-toolbar";

export const dynamic = "force-dynamic";

export async function generateMetadata() { return publicMetadata("/"); }

export default async function Home() {
  const { data: profile, photo, cv, unavailable } = await getPublicSettings();
  const presentation = await getPresentation();
  const projectsEnabled = presentation.pages.find((page) => page.path === "/projects")?.enabled;
  const github = contactActions(profile).find((action) => action.channel === "github");
  return (
    <><AdminToolbar /><PageContainer className="portfolio-home">
      {unavailable && <p role="status" className="pt-5 text-sm text-muted">Saved profile updates are temporarily unavailable. Showing confirmed owner information.</p>}
      <section
        aria-labelledby="hero-title"
        className="relative border-b border-border py-12 sm:py-16 lg:py-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_25%,#16363c_0%,transparent_55%)]"
        />
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="min-w-0">
        <p className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {photo && <Image priority sizes="64px" src={photo.url} alt={photo.alt || profile.name} width={64} height={64} className="size-16 shrink-0 rounded-full border border-accent/30 object-cover object-top lg:hidden" />}
          <span className="h-px w-8 bg-accent" />
          <span className="hero-owner-name">{profile.name}</span>
        </p>
        <HeroHeading headline={profile.headline} roles={presentation.roles} enabled={presentation.animations} />
        <p className="mt-8 max-w-2xl text-base leading-8 text-muted sm:text-lg">
          {profile.introduction}
        </p>
        {profile.availability && <p className="mt-5 text-sm text-accent">{profile.availability}</p>}
        
        <div className="mt-10 flex flex-wrap gap-4">
          {projectsEnabled && <Link href="/projects" className={buttonStyles()}>
            Explore projects <span aria-hidden="true">↘</span>
          </Link>}
          {github && <a href={github.href} className={buttonStyles("secondary")}>
            GitHub <span aria-hidden="true">↗</span>
          </a>}
          {cv && <a href={cv.url} target="_blank" rel="noopener noreferrer" className={buttonStyles("secondary")}>View CV (PDF)</a>}
        </div>
        </div>
        <div className="hero-studio relative min-w-0 rounded-[2rem] border border-white/10 bg-surface/70 p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <span>Software &amp; connected devices</span><span aria-hidden="true" className="size-2 rounded-full bg-accent" />
          </div>
          <div className="relative mx-auto hidden aspect-square w-full max-w-[300px] items-center justify-center lg:flex">
            <div aria-hidden="true" className="absolute inset-0 rounded-full border border-accent/15" />
            <div aria-hidden="true" className="absolute inset-4 rounded-full border border-dashed border-accent/20" />
            {photo ? <Image priority sizes="(max-width: 639px) 220px, 260px" src={photo.url} alt={photo.alt || profile.name} width={400} height={400} className="relative size-[76%] rounded-full border-4 border-background object-cover object-top shadow-[0_0_70px_#79e3de15]" /> : <span className="flex size-[76%] items-center justify-center rounded-full border border-accent/20 bg-background text-6xl font-semibold tracking-tighter text-accent" aria-label={profile.name}>SI</span>}
            <span className="absolute bottom-2 rounded-full border border-border bg-background px-5 py-2 text-sm font-medium">{profile.shortName} <span className="ml-2 text-accent" aria-hidden="true">&#8599;</span></span>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="overflow-hidden rounded-2xl border border-border bg-background/80 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">01 / Web</p>
              <WebPreview enabled={presentation.animations} />
              <p className="text-sm font-medium">Web experiences</p><p className="mt-1 text-xs leading-5 text-muted">Interfaces. Interaction.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-background/80 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">02 / Hardware</p>
              <HeroRobot enabled={presentation.animations} compactDisplay />
              <p className="text-sm font-medium">Desk Bot &amp; IoT</p><p className="mt-1 text-xs leading-5 text-muted">Code. Connect. Create.</p>
            </div>
          </div>
        </div>
        </div>
        <div className="mt-12 flex flex-wrap gap-3 font-mono text-xs text-muted [&>span]:rounded-full [&>span]:border [&>span]:border-border [&>span]:bg-surface/50 [&>span]:px-4 [&>span]:py-2">
          <span>Frontend Development</span>
          <span>Internet of Things</span>
          <span>Robotics</span>
        </div>
      </section>
      <section id="about" aria-labelledby="about-title" className="border-b border-border py-16 sm:py-24">
        <SectionHeading id="about-title" label="About" icon="about">At the intersection of web &amp; hardware.</SectionHeading>
        <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-muted sm:text-lg">{profile.biography || profile.introduction}</p>
        {(profile.city || profile.country) && <p className="mt-5 text-sm text-muted">Based in {[profile.city, profile.country].filter(Boolean).join(", ")}</p>}
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {profile.webFocusTitle && <Card className="relative overflow-hidden border-t-2 border-t-accent bg-gradient-to-br from-elevated to-surface">
            <span aria-hidden="true" className="mb-8 inline-flex size-12 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 font-mono text-lg text-accent">&lt;/&gt;</span>
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{profile.webFocusTitle}</h3>
            {profile.webFocusDescription && <p className="mt-4 max-w-lg leading-7 text-muted">{profile.webFocusDescription}</p>}
          </Card>}
          {profile.hardwareFocusTitle && <Card className="relative overflow-hidden border-t-2 border-t-sky-300 bg-gradient-to-br from-sky-950/30 to-surface">
            <span aria-hidden="true" className="mb-8 inline-flex size-12 items-center justify-center rounded-xl border border-sky-300/25 bg-sky-300/10 font-mono text-lg text-sky-200">{ "{ }" }</span>
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{profile.hardwareFocusTitle}</h3>
            {profile.hardwareFocusDescription && <p className="mt-4 max-w-lg leading-7 text-muted">{profile.hardwareFocusDescription}</p>}
          </Card>}
        </div>
      </section>
      {(profile.degree || profile.university || profile.department) && <section id="education" aria-labelledby="education-title" className="border-b border-border py-16 sm:py-24">
        <SectionHeading id="education-title" label="Education" icon="timeline">Learning across software and hardware.</SectionHeading>
        <Card className="mt-10 border-l-2 border-l-accent">
          {profile.degree && <h3 className="max-w-3xl text-xl leading-relaxed font-medium sm:text-2xl">{profile.degree}</h3>}
          {profile.department && <p className="mt-3 leading-7 text-muted">{profile.department}</p>}
          {profile.university && <p className="mt-4 leading-7 text-muted">{profile.university}</p>}
        </Card>
      </section>}
      <HomeSections />
      <HomeProducts />
      <section
        id="contact"
        aria-labelledby="contact-title"
        className="py-12 sm:py-16"
      >
        <div className="flex flex-col items-center gap-5 text-center [&>div:last-child]:justify-center">
          <div className="w-full">
            <SectionHeading id="contact-title" label="Contact" icon="contact">Get in touch.</SectionHeading>
            <p className="mt-4 text-muted">
              {profile.availability || "Find me through my public channels."}
            </p>
          </div>
          <ContactLinks data={profile} />
        </div>
        <ContactForm />
      </section>
    </PageContainer></>
  );
}
