"use client";
import { useEffect, useRef } from "react";
import { animate } from "motion/mini";

export function WebPreview({ enabled }: { enabled: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = host.current;
    if (!node || !enabled) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let animation: ReturnType<typeof animate> | undefined;
    const sync = () => {
      animation?.cancel();
      node.style.removeProperty("width");
      if (!visible || document.hidden || preference.matches) return;
      try { animation = animate(node, { width: ["100%", "72%", "100%"] }, { duration: 4.5, ease: "easeInOut" }); } catch { node.style.removeProperty("width"); }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(node);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); animation?.cancel(); node.style.removeProperty("width"); preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [enabled]);
  return <div aria-hidden="true" className="flex h-36 items-center justify-center">
    <div ref={host} className="w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
      <div className="flex gap-1 border-b border-border p-2"><i className="size-1 rounded-full bg-accent" /><i className="size-1 rounded-full bg-muted/50" /><i className="size-1 rounded-full bg-muted/30" /></div>
      <div className="space-y-2 p-3"><div className="h-2 w-2/3 rounded bg-accent/60" /><div className="h-1 w-full rounded bg-muted/30" /><div className="h-1 w-4/5 rounded bg-muted/30" /><div className="grid grid-cols-3 gap-1 pt-2"><div className="h-7 rounded bg-accent/10" /><div className="h-7 rounded bg-accent/20" /><div className="h-7 rounded bg-accent/10" /></div></div>
    </div>
  </div>;
}

