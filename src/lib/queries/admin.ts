/**
 * Queries tipadas usadas pelo painel admin.
 *
 * Esta camada existe pelo mesmo motivo que `/lib/queries/avaliacoes.ts`,
 * `estabelecimentos.ts`, `reservas.ts` e `perfis.ts`: **toda query
 * Supabase do projeto deve nascer aqui**, não inline em rotas. Com isso:
 *
 *   - O SELECT vira fonte única (não há duas listagens divergentes).
 *   - O payload exposto à UI é um tipo nomeado (`EstabAdminRow`,
 *     `ConteudoAdminRow`, `ReservaAdmin`, `AuditoriaRow`,
 *     `PerfilSensorialRow`, `AdminCounts`).
 *   - O guard em `core-payloads.guard.ts` (Parte 4) trava o build se
 *     algum desses payloads regredir para `any`/`unknown` ou divergir
 *     do shape esperado pela rota consumidora.
 *   - O ESLint rule `no-restricted-syntax` (eslint.config.js) impede
 *     que alguém volte a chamar `supabase.from("X").select(...)` fora
 *     desta pasta.
 *
 * Apenas **leituras** ficam aqui. `insert`/`update`/`delete` continuam
 * inline nas rotas — eles já recebem `TablesInsert`/`TablesUpdate`
 * tipados pelo client gerado e não têm shape de leitura para divergir.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  ESTAB_VIEW_SELECT,
  applyEstabelecimentosViewFilters,
  resolvePagination,
  ESTAB_PAGE_SIZE_DEFAULT,
  type EstabelecimentoView,
  type EstabelecimentosViewFilters,
} from "./estabelecimentos";

// ─────────────────────────────────────────────────────────────────────────────
// Estabelecimentos — listagem admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * View administrativa de estabelecimento.
 *
 * **Reutiliza** integralmente `EstabelecimentoView` (mesmo shape do
 * card público — selos, recursos, destaque, mídia) e **adiciona** apenas
 * os campos exclusivos do painel admin:
 *
 *  - `status` — exibe inclusive `pendente`/`inativo`, que o público nunca vê.
 *  - `criado_em` — ordenação cronológica e auditoria.
 *  - `mensalidade_ativa` — flag comercial (assinatura paga).
 *  - `listagem_basica` — controla se o estab aparece em listagens free.
 *
 * Garantia: qualquer mudança no payload base de view (novo selo,
 * novo recurso) propaga automaticamente para o admin sem refator.
 * O guard em `core-payloads.guard.ts` trava o build se algo regredir.
 */
export type EstabelecimentoAdminView = EstabelecimentoView &
  Pick<
    Tables<"estabelecimentos">,
    "status" | "criado_em" | "mensalidade_ativa" | "listagem_basica"
  >;

/**
 * SELECT do payload admin = SELECT da view + 4 campos administrativos.
 * Mantido como template literal para reaproveitar `ESTAB_VIEW_SELECT`
 * — fonte única, impossível divergir do shape público.
 */
export const ESTAB_ADMIN_VIEW_SELECT = `
  ${ESTAB_VIEW_SELECT},
  status, criado_em, mensalidade_ativa, listagem_basica
` as const;

/**
 * Subset legado/enxuto da tabela `/admin/estabelecimentos`.
 *
 * Mantido como `Pick<EstabelecimentoAdminView, ...>` para garantir
 * que qualquer renomeação de campo na view admin propague aqui.
 *
 * @deprecated Prefira `EstabelecimentoAdminView` para novas telas —
 * inclui selos/recursos/destaque sem custo extra de banda.
 */
export type EstabAdminRow = Pick<
  EstabelecimentoAdminView,
  "id" | "nome" | "slug" | "tipo" | "cidade" | "estado" | "status" | "destaque" | "criado_em"
>;

/**
 * Lista estabelecimentos no payload admin completo (qualquer status).
 *
 * Aceita os mesmos filtros de `fetchEstabelecimentosView` (busca, tipos,
 * selos, recursos, paginação) — diferença é que **não** força
 * `status = 'ativo'`, então traz pendentes/inativos para o painel.
 */
export async function fetchEstabelecimentosAdminView(
  filters: EstabelecimentosViewFilters = {},
): Promise<EstabelecimentoAdminView[]> {
  const base = supabase
    .from("estabelecimentos")
    .select(ESTAB_ADMIN_VIEW_SELECT)
    .order("criado_em", { ascending: false });

  const q = applyEstabelecimentosViewFilters(base, filters);

  const { data, error } = await q.returns<EstabelecimentoAdminView[]>();
  if (error) throw error;
  return data ?? [];
}

/**
 * Versão legada/enxuta — devolve apenas as colunas de `EstabAdminRow`.
 *
 * Implementada por cima de `fetchEstabelecimentosAdminView` para nunca
 * divergir do shape canônico. Filtra colunas via `Pick` em runtime.
 *
 * @deprecated Prefira `fetchEstabelecimentosAdminView` para novas telas.
 */
export async function fetchEstabelecimentosAdmin(limit = 200): Promise<EstabAdminRow[]> {
  const rows = await fetchEstabelecimentosAdminView({ limite: limit });
  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    slug: r.slug,
    tipo: r.tipo,
    cidade: r.cidade,
    estado: r.estado,
    status: r.status,
    destaque: r.destaque,
    criado_em: r.criado_em,
  }));
}

/**
 * Página tipada do payload admin — items + metadados de paginação.
 * Análoga a `EstabelecimentosViewPage` mas para o payload com `status`/`criado_em`.
 */
export interface EstabelecimentosAdminPage {
  items: EstabelecimentoAdminView[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

/**
 * Versão paginada de `fetchEstabelecimentosAdminView` — uma única ida
 * ao banco com `count: "exact"`. **Não** força `status='ativo'`, então
 * traz pendentes/inativos para o painel.
 */
export async function fetchEstabelecimentosAdminViewPaginated(
  filters: EstabelecimentosViewFilters = {},
): Promise<EstabelecimentosAdminPage> {
  const pag = resolvePagination({
    pagina: filters.pagina ?? 1,
    tamanhoPagina: filters.tamanhoPagina ?? ESTAB_PAGE_SIZE_DEFAULT,
  })!;

  const base = supabase
    .from("estabelecimentos")
    .select(ESTAB_ADMIN_VIEW_SELECT, { count: "exact" })
    .order("criado_em", { ascending: false });

  const q = applyEstabelecimentosViewFilters(base, {
    ...filters,
    pagina: pag.pagina,
    tamanhoPagina: pag.tamanhoPagina,
    limite: undefined,
  });

  const { data, error, count } = await q.returns<EstabelecimentoAdminView[]>();
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
export async function fetchEstabelecimentoAdminPorId(
  id: string,
): Promise<Tables<"estabelecimentos"> | null> {
  const { data, error } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conteúdo TEA — listagem admin
// ─────────────────────────────────────────────────────────────────────────────

export type ConteudoAdminRow = Pick<
  Tables<"conteudo_tea">,
  "id" | "titulo" | "slug" | "categoria" | "publicado" | "autor" | "criado_em" | "foto_capa"
>;

const CONTEUDO_ADMIN_SELECT =
  "id, titulo, slug, categoria, publicado, autor, criado_em, foto_capa" as const;

export async function fetchConteudosAdmin(limit = 300): Promise<ConteudoAdminRow[]> {
  const { data, error } = await supabase
    .from("conteudo_tea")
    .select(CONTEUDO_ADMIN_SELECT)
    .order("criado_em", { ascending: false })
    .limit(limit)
    .returns<ConteudoAdminRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function fetchConteudoAdminPorId(
  id: string,
): Promise<Tables<"conteudo_tea"> | null> {
  const { data, error } = await supabase
    .from("conteudo_tea")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reservas admin (com joins família + estabelecimento)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reserva enriquecida para o painel admin — inclui dados de contato
 * da família e identificação do estabelecimento.
 */
export type ReservaAdminRow = Tables<"reservas"> & {
  estabelecimentos: Pick<
    Tables<"estabelecimentos">,
    "id" | "nome" | "slug" | "cidade" | "estado" | "tipo"
  > | null;
  familia_profiles: Pick<
    Tables<"familia_profiles">,
    "id" | "nome_responsavel" | "email" | "telefone" | "cidade" | "estado"
  > | null;
};

const RESERVA_ADMIN_SELECT = `*,
  estabelecimentos(id, nome, slug, cidade, estado, tipo),
  familia_profiles(id, nome_responsavel, email, telefone, cidade, estado)
` as const;

export async function fetchReservasAdmin(limit = 300): Promise<ReservaAdminRow[]> {
  const { data, error } = await supabase
    .from("reservas")
    .select(RESERVA_ADMIN_SELECT)
    .order("criado_em", { ascending: false })
    .limit(limit)
    .returns<ReservaAdminRow[]>();
  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Auditoria de reservas
// ─────────────────────────────────────────────────────────────────────────────

export type AuditoriaRow = Tables<"reservas_auditoria">;

export async function fetchAuditoriaPorReserva(reservaId: string): Promise<AuditoriaRow[]> {
  const { data, error } = await supabase
    .from("reservas_auditoria")
    .select("*")
    .eq("reserva_id", reservaId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Perfis sensoriais — listagem rica para `/minha-conta/perfil-sensorial`
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subset usado na página de perfis sensoriais da família. Exporta só
 * os campos que a UI realmente exibe — evita carregar a row gigante.
 */
export type PerfilSensorialRow = Pick<
  Tables<"perfil_sensorial">,
  | "id"
  | "nome_autista"
  | "idade"
  | "nivel_tea"
  | "precisa_sala_sensorial"
  | "precisa_checkin_antecipado"
  | "precisa_fila_prioritaria"
  | "precisa_cardapio_visual"
  | "precisa_concierge_tea"
  | "sensivel_sons"
  | "sensivel_luz"
>;

const PERFIL_LIST_SELECT = `id, nome_autista, idade, nivel_tea,
  precisa_sala_sensorial, precisa_checkin_antecipado, precisa_fila_prioritaria,
  precisa_cardapio_visual, precisa_concierge_tea, sensivel_sons, sensivel_luz` as const;

export async function fetchPerfisSensoriaisDaFamilia(
  familiaId: string,
): Promise<PerfilSensorialRow[]> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select(PERFIL_LIST_SELECT)
    .eq("familia_id", familiaId)
    .order("criado_em")
    .returns<PerfilSensorialRow[]>();
  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard counts — `/admin`
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminCounts {
  estabelecimentos: number;
  reservasPendentes: number;
  conteudos: number;
  familias: number;
}

/** Conta linhas de cada domínio (head: true — não traz payload). */
export async function fetchAdminCounts(): Promise<AdminCounts> {
  const [estabs, reservas, conteudos, familias] = await Promise.all([
    supabase.from("estabelecimentos").select("id", { count: "exact", head: true }),
    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente"),
    supabase.from("conteudo_tea").select("id", { count: "exact", head: true }),
    supabase.from("familia_profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    estabelecimentos: estabs.count ?? 0,
    reservasPendentes: reservas.count ?? 0,
    conteudos: conteudos.count ?? 0,
    familias: familias.count ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Conteúdo TEA — leituras públicas (consumidas em /conteudo, /conteudo/$slug
// e na home). Mesma fonte da listagem admin, payload simplificado.
// ─────────────────────────────────────────────────────────────────────────────

export type ConteudoPublico = Tables<"conteudo_tea">;

export type ConteudoCard = Pick<
  Tables<"conteudo_tea">,
  "slug" | "titulo" | "resumo" | "foto_capa" | "categoria" | "criado_em" | "autor"
>;

const CONTEUDO_CARD_SELECT =
  "slug, titulo, resumo, foto_capa, categoria, criado_em, autor" as const;

import type { Database } from "@/integrations/supabase/types";
type ConteudoCategoria = Database["public"]["Enums"]["conteudo_categoria"];

/** Lista artigos publicados, opcionalmente filtrando por categoria. */
export async function fetchConteudosPublicados(
  filters: { categoria?: ConteudoCategoria; limite?: number } = {},
): Promise<ConteudoCard[]> {
  let q = supabase
    .from("conteudo_tea")
    .select(CONTEUDO_CARD_SELECT)
    .eq("publicado", true)
    .order("criado_em", { ascending: false });
  if (filters.categoria) q = q.eq("categoria", filters.categoria);
  if (filters.limite) q = q.limit(filters.limite);
  const { data, error } = await q.returns<ConteudoCard[]>();
  if (error) throw error;
  return data ?? [];
}

/** Busca um artigo publicado por slug (ou null se não publicado). */
export async function fetchConteudoPorSlug(slug: string): Promise<ConteudoPublico | null> {
  const { data, error } = await supabase
    .from("conteudo_tea")
    .select("*")
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Artigos relacionados (mesma categoria, excluindo o slug atual). */
export async function fetchConteudosRelacionados(
  categoria: ConteudoCategoria,
  excluirSlug: string,
  limite = 3,
): Promise<ConteudoPublico[]> {
  const { data, error } = await supabase
    .from("conteudo_tea")
    .select("*")
    .eq("publicado", true)
    .eq("categoria", categoria)
    .neq("slug", excluirSlug)
    .limit(limite);
  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth/role + dashboards leves consumidos por hooks/rotas públicas
// ─────────────────────────────────────────────────────────────────────────────

/** Verifica se um usuário tem role admin. */
export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

/** Primeiro perfil sensorial completo da família — usado em /explorar. */
export async function fetchPrimeiroPerfilSensorial(
  familiaId: string,
): Promise<Tables<"perfil_sensorial"> | null> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select("*")
    .eq("familia_id", familiaId)
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Estatísticas resumidas do dashboard /minha-conta. */
export interface FamiliaStats {
  perfis: number;
  reservas: number;
  primeiroNome: string;
}

export async function fetchFamiliaStats(familiaId: string): Promise<FamiliaStats> {
  const [{ count: pc }, { count: rc }, { data: prof }] = await Promise.all([
    supabase
      .from("perfil_sensorial")
      .select("id", { count: "exact", head: true })
      .eq("familia_id", familiaId),
    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("familia_id", familiaId),
    supabase
      .from("perfil_sensorial")
      .select("nome_autista")
      .eq("familia_id", familiaId)
      .order("criado_em")
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    perfis: pc ?? 0,
    reservas: rc ?? 0,
    primeiroNome: prof?.nome_autista ?? "",
  };
}