"use client";

import { animate } from "motion/mini";
import { useEffect, useRef, useState } from "react";

export const defaultRoles = ["Web Developer", "IoT & Robotics Enthusiast", "Building Software & Connected Devices"];

export function HeroHeading({ headline, roles = defaultRoles, enabled = true }: { headline: string; roles?: string[]; enabled?: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const words = Array.from(heading.current?.querySelectorAll<HTMLElement>("[data-word]") ?? []);
    const animations: ReturnType<typeof animate>[] = [];
    const reset = () => {
      animations.forEach((animation) => animation.cancel());
      words.forEach((word) => { word.style.removeProperty("transform"); word.style.removeProperty("opacity"); });
    };
    if (!preference.matches) {
      try { words.forEach((word, i) => animations.push(animate(word, { opacity: [0.65, 1], transform: ["translateY(8px)", "translateY(0)"] }, { duration: 0.4, delay: Math.min(i * 0.035, 0.3), ease: "easeOut" }))); }
      catch { reset(); }
    }
    preference.addEventListener("change", reset);
    return () => { reset(); preference.removeEventListener("change", reset); };
  }, [headline, enabled]);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const labels = Array.from(node.querySelectorAll<HTMLElement>("[data-role]"));
    let active = 0;
    let inView = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let animation: ReturnType<typeof animate> | undefined;
    const stop = () => { clearInterval(timer); animation?.cancel(); };
    const show = (index: number) => labels.forEach((label, i) => { label.style.visibility = i === index ? "visible" : "hidden"; });
    const sync = () => {
      stop();
      if (preference.matches || !enabled) { active = 0; show(0); return; }
      if (paused || !inView || document.hidden || labels.length < 2) return;
      timer = setInterval(() => {
        animation?.cancel(); active = (active + 1) % labels.length; show(active);
        try { animation = animate(labels[active], { opacity: [0.6, 1], transform: ["translateY(5px)", "translateY(0)"] }, { duration: 0.25 }); }
        catch { stop(); }
      }, 4500);
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(node); preference.addEventListener("change", sync); document.addEventListener("visibilitychange", sync); sync();
    return () => { stop(); show(0); observer.disconnect(); preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [roles, paused, enabled]);

  return <>
    <h1 ref={heading} id="hero-title" className="max-w-4xl text-4xl leading-[1.1] font-semibold tracking-[-0.045em] sm:text-5xl xl:text-6xl">
      <span className="sr-only">{headline}</span>
      <span aria-hidden="true">{headline.split(/\s+/).map((word, i) => <span key={`${word}-${i}`}><span data-word className="inline-block">{word}</span>{" "}</span>)}</span>
    </h1>
    {roles.length > 0 && <div ref={host} className="mt-6 flex items-start gap-3 text-sm leading-6 text-accent sm:text-base">
      <p className="sr-only">{roles.join(". ")}</p>
      <div aria-hidden="true" className="grid min-w-0 flex-1">{roles.map((role, i) => <span key={`${role}-${i}`} data-role className="col-start-1 row-start-1" style={{ visibility: i === 0 ? "visible" : "hidden" }}>{role}</span>)}</div>
      {enabled && roles.length > 1 && <button type="button" aria-pressed={paused} aria-label={paused ? "Resume role rotation" : "Pause role rotation"} onClick={() => setPaused(!paused)} className="role-toggle shrink-0 rounded border border-border px-2 py-1 text-xs text-muted hover:text-foreground">{paused ? "Resume" : "Pause"}</button>}
    </div>}
  </>;
}
