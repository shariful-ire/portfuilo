"use client";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { markdownElements, safeMarkdownUrl } from "@/lib/posts/markdown";
export function MarkdownBody({ body }: { body: string }) {
 return <div className="post-prose"><Markdown skipHtml allowedElements={markdownElements} rehypePlugins={[rehypeSanitize]} urlTransform={safeMarkdownUrl} components={{ h1: ({ children }) => <h2>{children}</h2>, a: ({ href, children }) => href ? <a href={href} rel="noopener noreferrer">{children}</a> : <span>{children}</span> }}>{body}</Markdown></div>;
}
