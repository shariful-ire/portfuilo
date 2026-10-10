"use client";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ContactAction } from "@/lib/contact/links";
import { Button } from "@/components/ui/button";
export function FloatingContact({ actions }: { actions: ContactAction[] }) {
 const [open, setOpen] = useState(false); const wrapper = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null); const id = useId(); const pathname = usePathname();
 useEffect(() => {
  if (!open) return;
  function escape(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }
  function outside(event: PointerEvent) { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); }
  document.addEventListener("keydown", escape); document.addEventListener("pointerdown", outside);
  return () => { document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside); };
 }, [open]);
 const channels = actions.filter((action) => ["whatsapp", "telegram", "email"].includes(action.channel));
 if (!channels.length || pathname.startsWith("/dashboard")) return null;
 return <div ref={wrapper} className="fixed right-4 bottom-4 z-40 max-w-[calc(100vw-2rem)]" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}><nav id={id} aria-label="Contact options" hidden={!open} className="mb-3 rounded-xl border border-border bg-surface p-4 shadow-xl"><p className="mb-2 text-sm text-muted">Open a contact app</p><ul className="space-y-1">{channels.map((action) => <li key={action.channel}><a href={action.href} className="block rounded px-4 py-3 text-accent hover:bg-elevated">{action.label}</a></li>)}</ul></nav><Button ref={trigger} aria-expanded={open} aria-controls={id} onClick={() => { setOpen(!open); if (!open) requestAnimationFrame(() => wrapper.current?.querySelector("a")?.focus()); }}>{open ? "Close contact options" : "Contact options"}</Button></div>;
}
