import type { SectionContent } from "../content/sections";
import type { ProjectView } from "../projects/schema";
import type { CertificateView } from "../certificates/schema";
import type { PostView } from "../posts/schema";
export type SkillView = { id: string; name: string; category?: string; description?: string };
export type TimelineView = { id: string; kind: "education" | "experience"; title: string; organization: string; description?: string; startMonth?: string; endMonth?: string; current: boolean };
type ImageView = { url: string; alt: string; caption?: string };
export type ResolvedContent =
 | { type: "rich-text"; blocks: SectionContent<"rich-text">["blocks"] }
 | { type: "image-and-text"; blocks: SectionContent<"rich-text">["blocks"]; image?: ImageView; imageSide: "left" | "right" }
 | { type: "gallery"; images: ImageView[] }
 | { type: "projects"; items: ProjectView[] }
 | { type: "certificates"; items: CertificateView[] }
 | { type: "posts"; items: PostView[] }
 | { type: "skills"; items: SkillView[] }
 | { type: "timeline"; items: TimelineView[] }
 | { type: "cta"; body: string; action: { label: string; href: string } };
export type ResolvedSection = { id: string; title: string; subtitle?: string; content: ResolvedContent };
