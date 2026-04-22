/**
 * Helpers únicos de mídia (galeria + Tour 360°) para `estabelecimentos`.
 *
 * Centraliza shape e normalização dos campos `fotos` (jsonb), `foto_capa`
 * e `tour_360_url` para que todos os consumidores (página de detalhe, card
 * de listagem, form admin, reservas embed) lidem com o **mesmo payload
 * tipado** — sem `as`, sem `Json`, sem strings vazias falseando guards
 * `{x && ...}`.
 *
 * Contrato:
 *  - `fotos`: sempre `string[]` (jamais `null`/`Json`/objeto). Strings
 *    vazias e itens inválidos são descartados.
 *  - `fotoCapa`, `tour360Url`: `string | null`. Whitespace vira `null`.
 *  - Idempotente: passar um payload já normalizado retorna o mesmo shape.
 *
 * Os guards em `src/integrations/supabase/types.guard.ts` travam o build
 * se este contrato regredir.
 */

/** Trim e converte string vazia em `null`. */
export function normalizeUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * Normaliza o JSONB `fotos` em `string[]`.
 *
 * Aceita:
 *  - `null` / `undefined`               → `[]`
 *  - array de strings                   → strings não vazias
 *  - array de objetos `{ url: string }` → extrai `url` (compat futura)
 *  - qualquer outra coisa               → `[]` (defensive)
 */
export function normalizeFotos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === "string") {
      const s = item.trim();
      if (s) out.push(s);
    } else if (
      item &&
      typeof item === "object" &&
      "url" in item &&
      typeof (item as { url: unknown }).url === "string"
    ) {
      const s = (item as { url: string }).url.trim();
      if (s) out.push(s);
    }
  }
  return out;
}

/**
 * Shape padronizado de mídia consumido pela UI.
 *
 * Toda página/componente que renderiza galeria, capa ou Tour 360°
 * recebe este objeto — não acessa `row.fotos`/`row.foto_capa` direto.
 */
export interface EstabMedia {
  /** Capa principal (string saneada ou `null`). */
  fotoCapa: string | null;
  /** Galeria adicional — sempre array, eventualmente vazio. */
  fotos: string[];
  /** URL do Tour 360° (string saneada ou `null`). */
  tour360Url: string | null;
}

/** Forma mínima de uma row de estabelecimento que carrega mídia. */
export interface EstabMediaRow {
  foto_capa?: string | null;
  fotos?: unknown;
  tour_360_url?: string | null;
}

/**
 * Extrai e normaliza os três campos de mídia de uma row crua do Supabase.
 * Use isto em vez de acessar `row.fotos`/`row.foto_capa`/`row.tour_360_url`
 * diretamente.
 */
export function pickEstabMedia(row: EstabMediaRow): EstabMedia {
  return {
    fotoCapa: normalizeUrl(row.foto_capa ?? null),
    fotos: normalizeFotos(row.fotos),
    tour360Url: normalizeUrl(row.tour_360_url ?? null),
  };
}
