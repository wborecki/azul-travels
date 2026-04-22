/**
 * Queries tipadas para `estabelecimentos`.
 *
 * Payload unificado `EstabelecimentoView` reutilizado em:
 *   - listagem (/explorar)
 *   - cards (landing, destaques, benefícios)
 *   - detalhe (/estabelecimento/:slug)
 *
 * Mesmo SELECT, mesmo shape — sem duplicação. Para a página de
 * detalhe (que precisa de campos adicionais como descricao,
 * endereco, telefone, etc.), use `EstabelecimentoFull`.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { fetchAvaliacoesPublicasPorEstab, type AvaliacaoComFamilia } from "./avaliacoes";
import { normalizeFotos, normalizeUrl, pickEstabMedia, type EstabMedia } from "@/lib/media";

// O subpath `@supabase/postgrest-js` não está exposto na resolução do
// projeto (vem como dep transitiva de `supabase-js`). Em vez de
// importá-lo direto, derivamos o tipo do builder a partir do próprio
// client — mesmo shape, sem acoplar a um package que pode não estar
// instalado. Exportado para reuso em testes de tipo.
export type EstabPostgrestBuilder = ReturnType<
  ReturnType<typeof supabase.from<"estabelecimentos">>["select"]
>;

/** Tipo completo da row, idêntico ao schema (usado no detalhe). */
export type EstabelecimentoFull = Tables<"estabelecimentos">;

/**
 * Versão normalizada de `EstabelecimentoFull` para consumo seguro no UI.
 *
 * Garantias adicionais sobre o payload bruto do Supabase:
 *  - `fotos`: sempre `string[]` (nunca `Json`/`null`/objeto). Entradas
 *    inválidas (não-string ou string vazia) são descartadas.
 *  - `tour_360_url`, `foto_capa`, `website`: `string | null` — strings
 *    vazias/whitespace viram `null` para simplificar os checks no UI
 *    (`{x && ...}` passa a refletir intenção real).
 *  - `latitude`/`longitude`: `number | null` — qualquer valor inválido
 *    (NaN, infinito, fora de faixa) vira `null` para evitar pin no
 *    meio do oceano.
 *
 * Demais campos são repassados sem alteração.
 */
export type EstabelecimentoNormalized = Omit<
  EstabelecimentoFull,
  "fotos" | "tour_360_url" | "foto_capa" | "website" | "latitude" | "longitude"
> & {
  fotos: string[];
  tour_360_url: string | null;
  foto_capa: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** Aceita number já válido ou string parseável; rejeita NaN/Infinity. */
function cleanNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Converte uma row crua do Supabase no shape seguro de UI.
 * Idempotente — passar um `EstabelecimentoNormalized` retorna o mesmo shape.
 *
 * Usa o helper único de mídia (`@/lib/media`) para `fotos`, `foto_capa`
 * e `tour_360_url` — mesmo contrato consumido no card, no admin e na
 * página de detalhe.
 */
export function normalizeEstabelecimento(row: EstabelecimentoFull): EstabelecimentoNormalized {
  const media = pickEstabMedia(row);
  return {
    ...row,
    fotos: media.fotos,
    foto_capa: media.fotoCapa,
    tour_360_url: media.tour360Url,
    website: normalizeUrl(row.website),
    latitude: cleanNumber(row.latitude),
    longitude: cleanNumber(row.longitude),
  };
}

/**
 * Extrai o payload de mídia (`EstabMedia`) de uma row de view/embed.
 * Use em cards de listagem ou em embeds de reservas onde `EstabelecimentoView`
 * é suficiente — mesmo shape que `normalizeEstabelecimento(...)` retorna
 * para a página de detalhe.
 */
export function pickMediaFromView(
  row: Pick<EstabelecimentoFull, "foto_capa" | "tour_360_url"> & { fotos?: unknown },
): EstabMedia {
  return pickEstabMedia(row);
}

// Re-export do helper bruto de fotos para forms admin (que precisam
// trabalhar com `string[]` antes de serializar de volta no `Insert`).
export { normalizeFotos };

/**
 * Shape unificado para listagem/card/detalhe-resumo.
 * Inclui: identificação, localização, capa, todos os selos,
 * Tour 360°, todos os recursos sensoriais, benefício TEA, destaque.
 */
export type EstabelecimentoView = Pick<
  EstabelecimentoFull,
  | "id"
  | "slug"
  | "nome"
  | "tipo"
  | "cidade"
  | "estado"
  | "foto_capa"
  // Tour 360°
  | "tour_360_url"
  // Selos
  | "selo_azul"
  | "selo_azul_validade"
  | "selo_governamental"
  | "selo_privado"
  | "selo_privado_nome"
  // Benefício TEA
  | "tem_beneficio_tea"
  | "beneficio_tea_descricao"
  // Recursos / flags sensoriais
  | "tem_sala_sensorial"
  | "tem_concierge_tea"
  | "tem_checkin_antecipado"
  | "tem_fila_prioritaria"
  | "tem_cardapio_visual"
  | "tem_caa"
  // Curadoria
  | "destaque"
>;

/** SELECT compartilhado — fonte única da verdade do payload de view. */
export const ESTAB_VIEW_SELECT = `
  id, slug, nome, tipo, cidade, estado, foto_capa,
  tour_360_url,
  selo_azul, selo_azul_validade, selo_governamental,
  selo_privado, selo_privado_nome,
  tem_beneficio_tea, beneficio_tea_descricao,
  tem_sala_sensorial, tem_concierge_tea, tem_checkin_antecipado,
  tem_fila_prioritaria, tem_cardapio_visual, tem_caa,
  destaque
` as const;

/** Chaves boolean de selo aplicáveis como filtro `eq(true)`. */
export type SeloFlag = "selo_azul" | "selo_governamental" | "selo_privado";

/** Chaves boolean de recursos sensoriais aplicáveis como filtro `eq(true)`. */
export type RecursoFlag =
  | "tem_sala_sensorial"
  | "tem_concierge_tea"
  | "tem_checkin_antecipado"
  | "tem_fila_prioritaria"
  | "tem_cardapio_visual"
  | "tem_caa";

/**
 * Filtros opcionais aplicáveis a qualquer listagem do payload View.
 *
 * **Paginação:**
 * - `pagina` (1-indexada) e `tamanhoPagina` são opcionais. Se ambos
 *   omitidos, retorna sem paginação (limitado por `limite` se fornecido).
 * - Se apenas `tamanhoPagina` for passado, assume `pagina = 1`.
 * - `pagina` e `tamanhoPagina` são clampados (mín. 1; tamanho ≤ 100)
 *   por `resolvePagination` para nunca explodir o servidor.
 * - Quando paginação está ativa, `limite` é ignorado.
 */
export interface EstabelecimentosViewFilters {
  /** Texto livre — busca em nome, cidade e tipo (ilike). */
  busca?: string;
  /** Múltiplos tipos (OR via `in`). Aceita também um único valor. */
  tipos?: ReadonlyArray<EstabelecimentoFull["tipo"]>;
  /** @deprecated use `tipos`. Mantido para compatibilidade. */
  tipo?: EstabelecimentoFull["tipo"];
  /** Selos exigidos (AND — todos precisam ser true). */
  selos?: ReadonlyArray<SeloFlag>;
  /** Recursos sensoriais exigidos (AND — todos precisam ser true). */
  recursos?: ReadonlyArray<RecursoFlag>;
  /** Sigla do estado (UF). */
  estado?: string;
  apenasDestaque?: boolean;
  apenasComBeneficio?: boolean;
  apenasComTour360?: boolean;
  /** Limita o número total de itens. Ignorado quando há paginação. */
  limite?: number;
  /** Página 1-indexada. Use junto com `tamanhoPagina`. */
  pagina?: number;
  /** Itens por página (clampado entre 1 e 100). */
  tamanhoPagina?: number;
}

/** Limites de paginação aplicados em `resolvePagination`. */
export const ESTAB_PAGE_SIZE_MAX = 100;
export const ESTAB_PAGE_SIZE_DEFAULT = 24;

/** Resultado de paginação resolvida (sempre números válidos). */
export interface ResolvedPagination {
  /** Página 1-indexada. */
  pagina: number;
  /** Tamanho da página, clampado em [1, ESTAB_PAGE_SIZE_MAX]. */
  tamanhoPagina: number;
  /** Offset inclusivo (passado para `.range`). */
  from: number;
  /** Offset inclusivo final (passado para `.range`). */
  to: number;
}

/**
 * Normaliza `pagina`/`tamanhoPagina` para offsets seguros do Postgrest.
 * Retorna `null` se nenhum dos dois for fornecido (sem paginação).
 */
export function resolvePagination(
  filters: Pick<EstabelecimentosViewFilters, "pagina" | "tamanhoPagina">,
): ResolvedPagination | null {
  if (filters.pagina === undefined && filters.tamanhoPagina === undefined) return null;

  const tamanhoBruto = filters.tamanhoPagina ?? ESTAB_PAGE_SIZE_DEFAULT;
  const tamanhoPagina = Math.min(
    ESTAB_PAGE_SIZE_MAX,
    Math.max(1, Math.floor(tamanhoBruto)),
  );
  const pagina = Math.max(1, Math.floor(filters.pagina ?? 1));
  const from = (pagina - 1) * tamanhoPagina;
  const to = from + tamanhoPagina - 1;
  return { pagina, tamanhoPagina, from, to };
}

/**
 * Helper único de filtros — fonte da verdade para construir queries
 * sobre `estabelecimentos` no payload View. Reutilizado em landing,
 * /explorar, /beneficios-tea, etc. Evita duplicar `query.eq(...)`
 * espalhado pelas páginas.
 */
// Tipo aberto do builder do Postgrest — preserva o encadeamento tipado
// no caller, ao mesmo tempo em que evita acoplar o helper a um shape
// específico de Database/Schema (que mudaria o tipo dos parâmetros de
// `eq`/`in` para union literal e quebraria o uso compartilhado).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEstabBuilder = PostgrestFilterBuilder<any, any, any, any, any>;

export function applyEstabelecimentosViewFilters<Q extends AnyEstabBuilder>(
  query: Q,
  filters: EstabelecimentosViewFilters = {},
): Q {
  let q = query;

  if (filters.busca && filters.busca.trim()) {
    const term = filters.busca.trim().replace(/[,()]/g, " ");
    q = q.or(`nome.ilike.%${term}%,cidade.ilike.%${term}%,tipo.ilike.%${term}%`) as Q;
  }

  const tiposCombinados: ReadonlyArray<EstabelecimentoFull["tipo"]> = [
    ...(filters.tipos ?? []),
    ...(filters.tipo ? [filters.tipo] : []),
  ];
  if (tiposCombinados.length === 1) {
    q = q.eq("tipo", tiposCombinados[0]) as Q;
  } else if (tiposCombinados.length > 1) {
    q = q.in("tipo", tiposCombinados as readonly string[]) as Q;
  }

  if (filters.estado) q = q.eq("estado", filters.estado) as Q;
  if (filters.apenasDestaque) q = q.eq("destaque", true) as Q;
  if (filters.apenasComBeneficio) q = q.eq("tem_beneficio_tea", true) as Q;
  if (filters.apenasComTour360) q = q.not("tour_360_url", "is", null) as Q;

  for (const s of filters.selos ?? []) q = q.eq(s, true) as Q;
  for (const r of filters.recursos ?? []) q = q.eq(r, true) as Q;

  // Paginação tem prioridade sobre `limite` (mais específica).
  const pag = resolvePagination(filters);
  if (pag) {
    q = q.range(pag.from, pag.to) as Q;
  } else if (filters.limite) {
    q = q.limit(filters.limite) as Q;
  }

  return q;
}

/** Lista estabelecimentos ativos no payload unificado de view. */
export async function fetchEstabelecimentosView(
  filters: EstabelecimentosViewFilters = {},
): Promise<EstabelecimentoView[]> {
  const base = supabase.from("estabelecimentos").select(ESTAB_VIEW_SELECT).eq("status", "ativo");

  const q = applyEstabelecimentosViewFilters(base, filters);

  const { data, error } = await q.returns<EstabelecimentoView[]>();
  if (error) throw error;
  return data ?? [];
}

/**
 * Página tipada de estabelecimentos — items + metadados de paginação.
 * Use `fetchEstabelecimentosViewPaginated` quando precisar do total /
 * número de páginas para renderizar uma paginação visual.
 */
export interface EstabelecimentosViewPage {
  items: EstabelecimentoView[];
  /** Total de linhas que casam com os filtros (independente da página). */
  total: number;
  /** Página 1-indexada efetivamente retornada (após clamp). */
  pagina: number;
  /** Tamanho da página efetivamente usado (após clamp). */
  tamanhoPagina: number;
  /** `Math.max(1, ceil(total / tamanhoPagina))`. */
  totalPaginas: number;
}

/**
 * Versão paginada de `fetchEstabelecimentosView`. Faz uma única ida
 * ao banco com `count: "exact"` — o total é devolvido junto, evitando
 * uma segunda query.
 *
 * Sempre paginado: se `pagina`/`tamanhoPagina` não vierem, usa
 * `pagina=1` e `tamanhoPagina=ESTAB_PAGE_SIZE_DEFAULT`.
 */
export async function fetchEstabelecimentosViewPaginated(
  filters: EstabelecimentosViewFilters = {},
): Promise<EstabelecimentosViewPage> {
  const pag = resolvePagination({
    pagina: filters.pagina ?? 1,
    tamanhoPagina: filters.tamanhoPagina ?? ESTAB_PAGE_SIZE_DEFAULT,
  })!;

  const base = supabase
    .from("estabelecimentos")
    .select(ESTAB_VIEW_SELECT, { count: "exact" })
    .eq("status", "ativo");

  // Reusa o helper, mas garante a mesma paginação resolvida.
  const q = applyEstabelecimentosViewFilters(base, {
    ...filters,
    pagina: pag.pagina,
    tamanhoPagina: pag.tamanhoPagina,
    limite: undefined,
  });

  const { data, error, count } = await q.returns<EstabelecimentoView[]>();
  if (error) throw error;
  const total = count ?? 0;
  return {
    items: data ?? [],
    total,
    pagina: pag.pagina,
    tamanhoPagina: pag.tamanhoPagina,
    totalPaginas: Math.max(1, Math.ceil(total / pag.tamanhoPagina)),
  };
}

/**
 * Busca um estabelecimento ativo por slug.
 *
 * Retorna o payload **normalizado** (`EstabelecimentoNormalized`) — campos
 * opcionais como `fotos` e URLs já chegam saneados, dispensando guards e
 * casts (`as string[]`) na UI consumidora.
 */
export async function fetchEstabelecimentoPorSlug(
  slug: string,
): Promise<EstabelecimentoNormalized | null> {
  const { data, error } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .eq("status", "ativo")
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeEstabelecimento(data) : null;
}

/**
 * Payload composto para a página de detalhe.
 *
 * Reúne, num único objeto fortemente tipado, tudo o que `/estabelecimento/:slug`
 * precisa exibir: o estabelecimento normalizado + todas as avaliações públicas
 * (já com `familia_profiles.nome_responsavel` embutido).
 *
 * Garantias:
 *  - `estabelecimento`: `EstabelecimentoNormalized` (`fotos: string[]`, URLs
 *    saneadas, `latitude`/`longitude` numéricos válidos ou `null`).
 *  - `avaliacoes`: `AvaliacaoComFamilia[]` (sempre array — nunca `null`).
 *  - Sem `any`/`unknown` — guards em `types.guard.ts` travam o build se algo
 *    regredir.
 */
export interface EstabelecimentoDetalhe {
  estabelecimento: EstabelecimentoNormalized;
  avaliacoes: AvaliacaoComFamilia[];
}

/**
 * Helper único de data fetching para a página de detalhe.
 *
 * Faz, em paralelo:
 *  1. `estabelecimentos` por slug (com normalização do JSONB de fotos etc.).
 *  2. `avaliacoes` públicas com join `familia_profiles(nome_responsavel)`.
 *
 * Retorna `null` quando o estabelecimento não existe (ou não está ativo).
 * Erros do Supabase são propagados — o caller decide como exibir.
 */
export async function fetchEstabelecimentoDetalhe(
  slug: string,
): Promise<EstabelecimentoDetalhe | null> {
  const estabelecimento = await fetchEstabelecimentoPorSlug(slug);
  if (!estabelecimento) return null;

  const avaliacoes = await fetchAvaliacoesPublicasPorEstab(estabelecimento.id);
  return { estabelecimento, avaliacoes };
}

// ──────────────────────────────────────────────────────────────
// Aliases legados (compatibilidade) — preferir os nomes acima.
// ──────────────────────────────────────────────────────────────
/** @deprecated use `EstabelecimentoFull` */
export type Estabelecimento = EstabelecimentoFull;
/** @deprecated use `EstabelecimentoView` */
export type EstabelecimentoCard = EstabelecimentoView;
/** @deprecated use `fetchEstabelecimentosView` */
export const fetchEstabelecimentosCards = fetchEstabelecimentosView;
