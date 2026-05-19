/**
 * Regression test: each authenticated layout must render exactly one logo/header chrome.
 *
 * Background: the global <Header /> in src/routes/__root.tsx used to render alongside
 * the route-internal header on /admin, /minha-conta, /meu-estabelecimento and
 * /minha-empresa, producing two logos on screen. The fix was to skip the global
 * chrome (hasOwnChrome / isAdmin branches) for these path prefixes.
 *
 * Without a browser-test runtime in this project (no Playwright/RTL/jsdom), we
 * enforce the invariant statically by parsing __root.tsx and each authenticated
 * route file. This catches the regression patterns that produce a duplicated logo:
 *
 *   1. __root.tsx stops excluding one of the authenticated path prefixes.
 *   2. An authenticated route layout starts rendering more than one
 *      logo-bearing chrome (either <Header /> + <Logo />, or two <Header />,
 *      or two <Logo />).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// Strip JS/JSX comments so `{/* <Header /> */}` and `// <Logo />` don't count.
function stripComments(src: string): string {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "") // {/* ... */}
    .replace(/\/\*[\s\S]*?\*\//g, "")           // /* ... */
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");      // // ... (skip http://)
}

// Count opening JSX tags `<Name` (component or lowercase element).
function countJsxOpen(src: string, name: string): number {
  const re = new RegExp(`<${name}(?=[\\s/>])`, "g");
  return (src.match(re) ?? []).length;
}

const AUTH_PREFIXES = [
  "/admin",
  "/minha-conta",
  "/meu-estabelecimento",
  "/minha-empresa",
];

describe("__root.tsx skips global chrome for authenticated areas", () => {
  const root = stripComments(read("src/routes/__root.tsx"));

  for (const prefix of AUTH_PREFIXES) {
    it(`mentions ${prefix} in the hasOwnChrome/isAdmin/isAuthFlow guard`, () => {
      // The path prefix must appear in one of the guard expressions so the
      // RootComponent branches into the variant that does NOT render <Header />.
      expect(root).toContain(`"${prefix}"`);
    });
  }

  it("has a branch that renders <Outlet /> without the global <Header />", () => {
    // The early-return branch must exist and must NOT render <Header />.
    const branchMatch = root.match(
      /if\s*\([^)]*?(isAdmin|isAuthFlow|hasOwnChrome)[^)]*?\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\)\s*;[\s\S]*?\}/,
    );
    expect(branchMatch, "early-return branch for authenticated paths").not.toBeNull();
    const branchJsx = branchMatch![2];
    expect(branchJsx).not.toMatch(/<Header(\s|\/|>)/);
    expect(branchJsx).toMatch(/<Outlet(\s|\/|>)/);
  });
});

describe("each authenticated route layout renders exactly one logo chrome", () => {
  // Files that own a full layout for an authenticated area.
  // Each must contain exactly ONE source of the brand logo:
  //   - either render <Header /> (which itself renders <Logo />), OR
  //   - render <Logo /> directly (e.g. inside an in-page sidebar),
  // but never both, and never twice.
  const LAYOUTS = [
    "src/routes/admin.tsx",
    "src/routes/minha-conta.tsx",
    "src/routes/meu-estabelecimento.tsx",
    "src/routes/minha-empresa.tsx",
  ];

  for (const path of LAYOUTS) {
    it(`${path}: <Header /> + <Logo /> combined occurrences === 1`, () => {
      const src = stripComments(read(path));
      const headers = countJsxOpen(src, "Header");
      const logos = countJsxOpen(src, "Logo");
      const total = headers + logos;
      expect(
        total,
        `expected exactly 1 logo-bearing chrome in ${path}, got ${total} ` +
          `(<Header /> x${headers}, <Logo /> x${logos})`,
      ).toBe(1);
    });
  }
});
