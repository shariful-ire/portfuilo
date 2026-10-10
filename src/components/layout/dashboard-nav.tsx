"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function DashboardNav() {
  const pathname = usePathname();
  return <nav aria-label="Dashboard" className="flex flex-wrap gap-2 md:flex-col">{[{ href: "/dashboard", label: "Overview" }, { href: "/dashboard/settings", label: "Profile & settings" }, { href: "/dashboard/certificates", label: "Certificates" }, { href: "/dashboard/projects", label: "Projects" }, { href: "/dashboard/posts", label: "Posts" }, { href: "/dashboard/sections", label: "Homepage sections" }, { href: "/dashboard/skills", label: "Skills" }, { href: "/dashboard/timeline", label: "Education / experience" }, { href: "/dashboard/inbox", label: "Contact inbox" }, { href: "/dashboard/account", label: "Account" }, { href: "/", label: "View portfolio ↗" }].map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className="rounded-lg px-4 py-3 text-sm text-muted hover:bg-elevated hover:text-foreground aria-[current=page]:bg-elevated aria-[current=page]:text-accent">{label}</Link>)}</nav>;
}
