import type { ReactNode } from "react";

const paths: Record<string, string> = {
  about: "M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  timeline: "m2 9 10-5 10 5-10 5-10-5 M6 11v6c4 3 8 3 12 0v-6 M22 9v7",
  projects: "m8 6-6 6 6 6 M16 6l6 6-6 6 M14 3l-4 18",
  certificates: "M5 3h14v13H5z M9 16v6l3-2 3 2v-6 M9 7h6 M9 11h6",
  posts: "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6",
  skills: "M9 3v3 M15 3v3 M9 18v3 M15 18v3 M3 9h3 M3 15h3 M18 9h3 M18 15h3 M6 6h12v12H6z M10 10h4v4h-4z",
  contact: "M3 5h18v14H3z m0 0 9 7 9-7",
  products: "m3 7 9-4 9 4v10l-9 4-9-4V7 M3 7l9 4 9-4 M12 11v10",
  gallery: "M3 3h18v18H3z m0 14 6-6 5 5 3-3 4 4 M15 7h.01",
};

/** Decorative icon complements, rather than replaces, the semantic heading. */
export function SectionHeading({ id, label, children, icon = "projects" }: {
  id?: string; label?: string; children: ReactNode; icon?: string;
}) {
  return <div className="section-title-group">
    <div className="section-title-row">
    <span className="section-title-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d={paths[icon] || paths.posts} /></svg>
    </span>
      <h2 id={id} className="section-title-text">{label || children}</h2>
    </div>
    {label && <p className="section-title-description">{children}</p>}
  </div>;
}
