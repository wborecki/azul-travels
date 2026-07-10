/**
 * Regression test: every screen must render exactly one logo/header chrome.
 *
 * Architecture: the global <Header /> in src/routes/__root.tsx renders for ALL
 * routes (public pages, /minha-conta, /meu-estabelecimento and /admin) except
 * the auth flows (login/cadastro/selecionar-perfil/reset-password) and the
 * legacy /minha-empresa page, which render their own chrome. The authenticated
 * layouts therefore must NOT render <Header /> or <Logo /> themselves — doing
 * so would put two logos on screen.
 *
 * Without a browser-test runtime in this project (no Playwright/RTL/jsdom), we
 * enforce the invariant statically by parsing __root.tsx and each authenticated
 * route file.
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
    .replace(/\/\*[\s\S]*?\*\//g, "") // /* ... */
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1"); // // ... (skip http://)
}

// Count opening JSX tags `<Name` (component or lowercase element).
function countJsxOpen(src: string, name: string): number {
  const re = new RegExp(`<${name}(?=[\\s/>])`, "g");
  return (src.match(re) ?? []).length;
}

describe("__root.tsx skips global chrome only for self-chromed routes", () => {
  const root = stripComments(read("src/routes/__root.tsx"));

  for (const prefix of ["/minha-empresa", "/login", "/cadastro", "/selecionar-perfil"]) {
    it(`mentions ${prefix} in the isAuthFlow/hasOwnChrome guard`, () => {
      expect(root).toContain(`"${prefix}"`);
    });
  }

  it("has a branch that renders <Outlet /> without the global <Header />", () => {
    const branchMatch = root.match(
      /if\s*\([^)]*?(isAuthFlow|hasOwnChrome)[^)]*?\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\)\s*;[\s\S]*?\}/,
    );
    expect(branchMatch, "early-return branch for self-chromed paths").not.toBeNull();
    const branchJsx = branchMatch![2];
    expect(branchJsx).not.toMatch(/<Header(\s|\/|>)/);
    expect(branchJsx).toMatch(/<Outlet(\s|\/|>)/);
  });
});

describe("authenticated layouts rely on the global chrome (no own logo/header)", () => {
  // These files render inside the root layout, which already provides the
  // global <Header /> (and its logo). Rendering <Header /> or <Logo /> here
  // duplicates the brand chrome.
  const LAYOUTS = [
    "src/routes/admin.tsx",
    "src/routes/minha-conta.tsx",
    "src/routes/meu-estabelecimento.tsx",
    "src/routes/meu-estabelecimento.index.tsx",
    "src/components/PainelSubNav.tsx",
  ];

  for (const path of LAYOUTS) {
    it(`${path}: renders neither <Header /> nor <Logo />`, () => {
      const src = stripComments(read(path));
      expect(countJsxOpen(src, "Header"), `${path} must not render <Header />`).toBe(0);
      expect(countJsxOpen(src, "Logo"), `${path} must not render <Logo />`).toBe(0);
    });
  }

  it("src/routes/minha-empresa.tsx: renders its own chrome with a single logo source", () => {
    const src = stripComments(read("src/routes/minha-empresa.tsx"));
    const headers = countJsxOpen(src, "Header");
    const logos = countJsxOpen(src, "Logo");
    expect(
      headers === 0 || logos === 0,
      "minha-empresa mixes <Header /> and <Logo />, duplicating the brand logo",
    ).toBe(true);
    expect(logos).toBeLessThanOrEqual(1);
  });
});
