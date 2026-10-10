import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownBody } from "../../src/components/posts/markdown-body";
const bodies: string[] = JSON.parse(readFileSync(0, "utf8"));
process.stdout.write(JSON.stringify(bodies.map((body) => renderToStaticMarkup(createElement(MarkdownBody, { body })))));
