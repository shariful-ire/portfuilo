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
    <><AdminToolbar /><PageContainer>
      {unavailable && <p role="status" className="pt-5 text-sm text-muted">Saved profile updates are temporarily unavailable. Showing confirmed owner information.</p>}
      <section
        aria-labelledby="hero-title"
        className="relative border-b border-border py-14 sm:py-20 lg:py-24"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_25%,#16363c_0%,transparent_55%)]"
        />
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0">
        <p className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="h-px w-8 bg-accent" />
          {profile.name}
        </p>
        <HeroHeading headline={profile.headline} roles={presentation.roles} enabled={presentation.animations} />
        <p className="mt-8 max-w-2xl text-base leading-8 text-muted sm:text-lg">
          {profile.introduction}
        </p>
        {profile.availability && <p className="mt-5 text-sm text-accent">{profile.availability}</p>}
        {photo && <Image sizes="192px" src={photo.url} alt={photo.alt} width={240} height={240} className="mt-8 size-48 rounded-2xl object-cover" />}
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
        <HeroRobot enabled={presentation.animations} />
        </div>
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6 font-mono text-xs text-muted">
          <span>Frontend Development</span>
          <span>Internet of Things</span>
          <span>Robotics</span>
        </div>
      </section>
      <section id="about" aria-labelledby="about-title" className="border-b border-border py-16 sm:py-24">
        <p className="section-eyebrow">About</p>
        <h2 id="about-title" className="section-heading">At the intersection of web &amp; hardware.</h2>
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
        <p className="section-eyebrow">Education</p>
        <h2 id="education-title" className="section-heading">Learning across software and hardware.</h2>
        <Card className="mt-10 border-l-2 border-l-accent">
          {profile.degree && <h3 className="max-w-3xl text-xl leading-relaxed font-medium sm:text-2xl">{profile.degree}</h3>}
          {profile.department && <p className="mt-3 leading-7 text-muted">{profile.department}</p>}
          {profile.university && <p className="mt-4 leading-7 text-muted">{profile.university}</p>}
        </Card>
      </section>}
      <HomeSections />
      <section
        id="contact"
        aria-labelledby="contact-title"
        className="py-16 sm:py-24"
      >
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
          Contact
        </p>
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <h2
              id="contact-title"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Get in touch.
            </h2>
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
