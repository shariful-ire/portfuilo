import assert from "node:assert/strict";
import { test } from "node:test";
import { configuredNavigation, parsePresentation, presentationDefaults, presentationSchema } from "../src/lib/settings/presentation";
import { settingsDefaults, settingsInputSchema } from "../src/lib/settings/schema";

test("presentation defaults preserve existing public pages and never configure admin routes", () => {
  const data = parsePresentation(settingsDefaults.presentationJson);
  assert.equal(data.pages.find((page) => page.path === "/about")?.enabled, false);
  assert.deepEqual(configuredNavigation(data).map((item) => item.href), ["/#about", "/projects", "/certificates", "/posts", "/ideas", "/products", "/#contact"]);
  for (const path of ["/dashboard", "/api/auth", "javascript:alert(1)", "https://example.com"]) {
    assert.equal(presentationSchema.safeParse({ ...data, pages: [{ ...data.pages[0], path }, ...data.pages.slice(1)] }).success, false);
  }
});
test("navigation respects saved order, hidden items, and disabled pages", () => {
  const data = structuredClone(presentationDefaults);
  data.pages.reverse();
  data.pages.find((page) => page.path === "/products")!.inNavigation = false;
  data.pages.find((page) => page.path === "/ideas")!.inNavigation = false;
  data.pages.find((page) => page.path === "/posts")!.label = "Articles";
  data.pages.find((page) => page.path === "/projects")!.enabled = false;
  data.pages.find((page) => page.path === "/certificates")!.inNavigation = false;
  assert.deepEqual(configuredNavigation(data), [{ label: "About", href: "/#about" }, { label: "Articles", href: "/posts" }, { label: "Contact", href: "/#contact" }]);
});
test("presentation validation rejects arbitrary assets, malformed JSON, duplicate pages and unbounded roles", () => {
  const invalid = [
    { ...presentationDefaults, logoId: "https://attacker.example/a.svg" },
    { ...presentationDefaults, logoId: "33333333-3333-4333-8333-333333333333", logoAlt: "" },
    { ...presentationDefaults, pages: presentationDefaults.pages.map(() => presentationDefaults.pages[0]) },
    { ...presentationDefaults, roles: Array(6).fill("Role") },
    { ...presentationDefaults, accent: "#111111" },
  ];
  for (const input of invalid) assert.equal(settingsInputSchema.safeParse({ ...settingsDefaults, presentationJson: JSON.stringify(input) }).success, false);
  assert.equal(settingsInputSchema.safeParse({ ...settingsDefaults, presentationJson: "invalid" }).success, false);
  assert.equal(presentationSchema.safeParse({ ...presentationDefaults, roles: [], animations: false }).success, true);
});
