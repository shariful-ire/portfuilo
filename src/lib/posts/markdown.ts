// No HTML, executable embeds, remote inline images, or MDX. Cover images use
// the validated media system. This policy is shared by preview and articles.
export const markdownElements = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "blockquote", "ul", "ol", "li", "a", "code", "pre", "hr", "br"];
export function safeMarkdownUrl(value: string) {
 if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return "";
 if (value.startsWith("#") || (value.startsWith("/") && !value.startsWith("//"))) return value;
 try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? value : ""; } catch { return ""; }
}
export function readingMinutes(markdown: string) {
 const text = markdown.replace(/<[^>]*>/g, " ").replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[`#*_>~|]/g, " ");
 const words = [...new Intl.Segmenter(undefined, { granularity: "word" }).segment(text)].filter((segment) => segment.isWordLike).length;
 return Math.max(1, Math.ceil(words / 200));
}
