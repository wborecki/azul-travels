/**
 * Auditoria estática: garante que nenhum <Button> ou <button> nas rotas
 * públicas (e componentes compartilhados usados por elas) renderize com
 * `text-white` sobre um fundo branco / sem fundo colorido explícito.
 *
 * O teste lê o código-fonte como texto, encontra cada elemento <Button|button>
 * e inspeciona o conteúdo do atributo `className` desse elemento. Se houver
 * `text-white` (ou `text-primary-foreground` quando o foreground também for
 * claro) sem nenhuma classe de fundo colorido reconhecida, o teste falha.
 *
 * Excluído: rotas /admin (área interna), /demo (intencionalmente isolada).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PROJECT_ROOT = join(__dirname, "..", "..");
const SRC = join(PROJECT_ROOT, "src");

// ---------- 1. Coleta de arquivos a auditar ----------

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else if (full.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

function isPublicSurface(absPath: string): boolean {
  const rel = relative(SRC, absPath).replaceAll("\\", "/");

  // Sempre auditar componentes compartilhados (excluindo subpastas demo/admin).
  if (rel.startsWith("components/")) {
    if (rel.startsWith("components/demo/")) return false;
    if (rel.startsWith("components/admin/")) return false;
    if (rel.startsWith("components/ui/")) return false; // shadcn primitives
    return true;
  }

  // Auditar todas as rotas públicas.
  if (rel.startsWith("routes/")) {
    const routeName = rel.slice("routes/".length);
    if (routeName.startsWith("admin")) return false;
    if (routeName.startsWith("demo")) return false;
    if (routeName === "__root.tsx") return false;
    if (routeName === "index.tsx") return false; // home auditada separadamente
    return true;
  }

  return false;
}

// ---------- 2. Extração de elementos <Button|button> ----------

interface FoundButton {
  file: string;
  line: number;
  snippet: string;
  className: string;
}

/**
 * Encontra a posição do `>` que fecha a tag de abertura, respeitando
 * chaves balanceadas (expressões JSX) e strings.
 */
function findTagEnd(src: string, start: number): number {
  let depth = 0;
  let inString: string | null = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      if (c === inString && src[i - 1] !== "\\") inString = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inString = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

/** Extrai o texto bruto do atributo className (string ou expressão JSX). */
function extractClassName(tagSrc: string): string | null {
  const idx = tagSrc.search(/\bclassName\s*=/);
  if (idx === -1) return null;
  let i = idx;
  while (i < tagSrc.length && tagSrc[i] !== "=") i++;
  i++;
  while (i < tagSrc.length && /\s/.test(tagSrc[i])) i++;

  if (tagSrc[i] === '"' || tagSrc[i] === "'") {
    const quote = tagSrc[i];
    const end = tagSrc.indexOf(quote, i + 1);
    return end === -1 ? null : tagSrc.slice(i + 1, end);
  }
  if (tagSrc[i] === "{") {
    let depth = 1;
    let j = i + 1;
    while (j < tagSrc.length && depth > 0) {
      if (tagSrc[j] === "{") depth++;
      else if (tagSrc[j] === "}") depth--;
      if (depth === 0) break;
      j++;
    }
    return tagSrc.slice(i + 1, j);
  }
  return null;
}

function findButtons(file: string, src: string): FoundButton[] {
  const out: FoundButton[] = [];
  // Captura <Button ...> e <button ...> (não fecha self / não importa)
  const re = /<(Button|button)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const tagStart = m.index;
    const end = findTagEnd(src, tagStart);
    if (end === -1) continue;
    const tag = src.slice(tagStart, end + 1);
    const cls = extractClassName(tag);
    if (cls === null) continue;
    const line = src.slice(0, tagStart).split("\n").length;
    out.push({
      file: relative(PROJECT_ROOT, file),
      line,
      snippet: tag.replaceAll(/\s+/g, " ").slice(0, 200),
      className: cls,
    });
  }
  return out;
}

// ---------- 3. Heurística "tem fundo colorido" ----------

/**
 * Tokens reconhecidos como fundo colorido / não-branco. Inclui semântica
 * de design tokens, cores arbitrárias com hex/rgb e variantes do shadcn
 * Button (default | secondary | destructive — todos com fundo colorido).
 *
 * NÃO inclui: bg-white, bg-background, bg-card, bg-popover, bg-transparent,
 * bg-white/X, bg-card/X, etc.
 */
const COLORED_BG_PATTERNS: RegExp[] = [
  /\bbg-primary(?![-\w])/,
  /\bbg-secondary(?![-\w])/,
  /\bbg-secondary\/\d/,
  /\bbg-primary\/\d/,
  /\bbg-destructive(?![-\w])/,
  /\bbg-accent(?![-\w])/,
  /\bbg-muted(?![-\w])/, // muted é cinza, mas não branco puro
  /\bbg-(red|blue|green|yellow|orange|purple|pink|teal|cyan|indigo|emerald|lime|amber|rose|violet|fuchsia|sky|slate|zinc|neutral|stone|gray)-\d{2,3}/,
  // Cores arbitrárias hex / rgb / hsl que NÃO sejam branco puro
  /\bbg-\[#(?!fff(f{3})?\b|FFF(F{3})?\b)[0-9a-fA-F]{3,8}\]/,
  /\bbg-\[(rgb|hsl|oklch)\(/,
  // Gradientes contam como fundo colorido
  /\bbg-gradient-/,
  /\bfrom-(primary|secondary|accent|\w+-\d{2,3}|\[#)/,
];

const WHITE_TEXT_PATTERNS: RegExp[] = [
  /\btext-white(?![-\w])/,
  /\btext-\[#fff(f{3})?\]/i,
];

/** Variantes do shadcn Button que já trazem fundo colorido por padrão. */
const COLORED_VARIANT_RE =
  /variant\s*=\s*["']?(default|secondary|destructive)["']?/;

function hasColoredBackground(className: string, tagSrc: string): boolean {
  if (COLORED_BG_PATTERNS.some((re) => re.test(className))) return true;
  if (COLORED_VARIANT_RE.test(tagSrc)) return true;
  // Hover-only fundo colorido continua deixando o estado padrão branco — não conta.
  return false;
}

function hasWhiteText(className: string): boolean {
  return WHITE_TEXT_PATTERNS.some((re) => re.test(className));
}

// ---------- 4. Teste ----------

describe("Acessibilidade visual: botões nas rotas públicas", () => {
  it("nenhum <Button> com text-white sem fundo colorido explícito", () => {
    const files = listFilesRecursive(SRC).filter(isPublicSurface);
    expect(files.length).toBeGreaterThan(0);

    const offenders: FoundButton[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      const buttons = findButtons(file, src);
      for (const b of buttons) {
        if (hasWhiteText(b.className) && !hasColoredBackground(b.className, b.snippet)) {
          offenders.push(b);
        }
      }
    }

    if (offenders.length > 0) {
      const msg = offenders
        .map(
          (o) =>
            `\n  • ${o.file}:${o.line}\n    className: "${o.className}"\n    tag: ${o.snippet}`,
        )
        .join("\n");
      throw new Error(
        `Encontrado(s) ${offenders.length} botão(ões) com text-white sem fundo colorido explícito (risco de branco-no-branco):${msg}\n\n` +
          `Corrija adicionando uma classe de fundo (ex: bg-primary, bg-secondary, bg-[#1B2E4B]) ` +
          `ou trocando text-white por text-primary/text-secondary.`,
      );
    }
    expect(offenders).toEqual([]);
  });
});
