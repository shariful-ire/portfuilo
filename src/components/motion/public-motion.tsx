"use client";

import { animate } from "motion/mini";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Progressive enhancement: content is always visible, even without JavaScript. */
export function PublicMotion({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!enabled) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const running = new Map<Element, ReturnType<typeof animate>>();
    const play = (element: HTMLElement, keyframes: Parameters<typeof animate>[1], duration = 0.2, delay = 0) => {
      if (preference.matches) return;
      running.get(element)?.cancel();
      try { running.set(element, animate(element, keyframes, { duration, delay, ease: "easeOut" })); }
      catch { element.style.removeProperty("transform"); element.style.removeProperty("opacity"); }
    };
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        play(entry.target as HTMLElement, { opacity: [0.85, 1], transform: ["translateY(10px)", "translateY(0)"] }, 0.35, entry.target.matches(".ui-card") ? Math.min(Array.from(entry.target.parentElement?.children ?? []).indexOf(entry.target) * 0.045, 0.18) : 0);
      }
    }, { threshold: 0.08 });
    const scan = () => document.querySelectorAll<HTMLElement>("main section, main .ui-card, main [data-motion-panel], main form, [role=alert], dialog[open]").forEach((section) => {
      if (seen.has(section)) return;
      seen.add(section);
      // Never animate initial above-the-fold content or delay reading.
      if (section.matches("[data-motion-panel], form, [role=alert], dialog[open]") || section.getBoundingClientRect().top >= window.innerHeight) observer.observe(section);
    });
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.getElementById("main-content") ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    const targets = (event: Event) => event.composedPath().filter((element): element is HTMLElement => element instanceof HTMLElement && element.matches(".ui-button, .ui-card, header nav a"));
    const enter = (event: PointerEvent) => {
      if (!fine.matches) return;
      for (const element of targets(event)) {
        if (element.matches(":disabled") || (event.relatedTarget instanceof Node && element.contains(event.relatedTarget))) continue;
        play(element, { transform: element.matches(".ui-card") ? "translateY(-3px)" : "translateY(-1px)" });
      }
    };
    const leave = (event: PointerEvent) => {
      for (const element of targets(event)) if (!(event.relatedTarget instanceof Node && element.contains(event.relatedTarget))) play(element, { transform: "translateY(0)" });
    };
    const press = (event: PointerEvent) => {
      const element = targets(event).find((target) => target.matches(".ui-button"));
      if (element?.matches(".ui-button:not(:disabled)")) play(element, { transform: ["scale(0.98)", "scale(1)"] }, 0.18);
    };
    const reset = () => { running.forEach((animation, element) => { animation.cancel(); (element as HTMLElement).style.removeProperty("transform"); (element as HTMLElement).style.removeProperty("opacity"); }); running.clear(); };
    preference.addEventListener("change", reset);
    document.addEventListener("pointerover", enter); document.addEventListener("pointerout", leave); document.addEventListener("pointerdown", press);
    return () => { reset(); observer.disconnect(); mutations.disconnect(); preference.removeEventListener("change", reset); document.removeEventListener("pointerover", enter); document.removeEventListener("pointerout", leave); document.removeEventListener("pointerdown", press); };
  }, [pathname, enabled]);
  return null;
}
