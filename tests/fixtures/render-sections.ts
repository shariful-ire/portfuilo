import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionRenderer, homepageComponents } from "../../src/components/home-sections/section-renderer";
import type { ResolvedContent } from "../../src/lib/home-manager/view-types";
const content: ResolvedContent[] = [{ type: "rich-text", blocks: [{ type: "paragraph", text: "<script>alert(1)</script>" }] }, { type: "image-and-text", blocks: [], imageSide: "left" }, { type: "gallery", images: [] }, { type: "projects", items: [] }, { type: "certificates", items: [] }, { type: "posts", items: [] }, { type: "skills", items: [{ id: "skill", name: "<script>fixture</script>" }] }, { type: "timeline", items: [{ id: "entry", title: "Fixture", organization: "Fixture", kind: "education", current: false }] }, { type: "cta", body: "<script>fixture</script>", action: { label: "Fixture", href: "/posts" } }];
const html = content.map((item, index) => renderToStaticMarkup(createElement(SectionRenderer, { section: { id: String(index), title: "Fixture", content: item } }))).join("");
process.stdout.write(JSON.stringify({ types: Object.keys(homepageComponents), html }));
