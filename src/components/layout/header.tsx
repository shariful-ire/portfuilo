"use client";

import { animate } from "motion/mini";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PageContainer } from "./page-container";

export function Header({ shortName, navigation, logo, animations = true }: { shortName: string; navigation: { href: string; label: string }[]; logo?: { url: string; alt: string } | null; animations?: boolean }) {
  const [open, setOpen] = useState(false);
  const mobileNav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!animations || !open || !mobileNav.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = animate(mobileNav.current, { opacity: [0.7, 1], transform: ["translateY(-5px)", "translateY(0)"] }, { duration: 0.16 });
    return () => animation.cancel();
  }, [open, animations]);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="border-b border-border bg-background/95" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); }
    }}>
      <PageContainer className="flex min-h-20 flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/" onClick={() => setOpen(false)} aria-label={`${shortName} — home`} className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          {logo ? <Image src={logo.url} alt={logo.alt} width={72} height={40} className="h-10 w-18 object-contain" /> : <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 font-mono text-sm text-accent">S.</span>}
          {shortName}<span className="text-accent" aria-hidden="true">/</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-5 lg:gap-8 md:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="py-2 text-sm text-muted transition-colors hover:text-accent">{item.label}</Link>)}
        </nav>
        <Button ref={toggle} variant="secondary" className="md:hidden" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}<span aria-hidden="true">{open ? "×" : "☰"}</span></Button>
        <nav ref={mobileNav} id="mobile-navigation" aria-label="Mobile" className={`${open ? "flex" : "hidden"} w-full flex-col gap-1 border-t border-border pt-3 md:hidden`}>
          {navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-muted hover:bg-surface hover:text-accent">{item.label}</Link>)}
        </nav>
      </PageContainer>
    </header>
  );
}
