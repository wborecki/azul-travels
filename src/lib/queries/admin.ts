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
  normalizeEstabelecimento,
  type EstabelecimentoView,
  type EstabelecimentosViewFilters,
  type EstabelecimentoFull,
  type EstabelecimentoDetalhe,
} from "./estabelecimentos";
import { fetchAvaliacoesPublicasPorEstab } from "./avaliacoes";

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

/**
 * Detalhe completo do estabelecimento para a tela de **pré-visualização** admin.
 *
 * Mesmo shape de `fetchEstabelecimentoDetalhe` (página pública), mas busca por
 * `id` e **ignora** o filtro `status = 'ativo'` — admins precisam revisar
 * estabelecimentos `pendente`/`inativo` exatamente como apareceriam para
 * famílias com TEA antes de publicar.
 *
 * Reaproveita `normalizeEstabelecimento` e `fetchAvaliacoesPublicasPorEstab`
 * para garantir paridade pixel-perfect com a rota pública.
 */
export async function fetchEstabelecimentoAdminDetalhe(
  id: string,
): Promise<EstabelecimentoDetalhe | null> {
  const { data, error } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const estabelecimento = normalizeEstabelecimento(data as EstabelecimentoFull);
  const avaliacoes = await fetchAvaliacoesPublicasPorEstab(estabelecimento.id);
  return { estabelecimento, avaliacoes };
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

/** Filtros aceitos pela listagem paginada de conteúdo admin. */
export interface ConteudosAdminFilters {
  /** Texto livre — busca em titulo, slug e autor (ilike). */
  busca?: string;
  /** Filtra por categoria do enum (omita para todas). */
  categoria?: Database["public"]["Enums"]["conteudo_categoria"];
  /** Filtra por status de publicação (omita para todos). */
  publicado?: boolean;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface ConteudosAdminPage {
  items: ConteudoAdminRow[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

/** Default de página para listagens admin (sem perfil específico de tela). */
const ADMIN_PAGE_SIZE_DEFAULT = 20;
const ADMIN_PAGE_SIZE_MAX = 100;

function clampPagina(pagina = 1, tamanhoPagina = ADMIN_PAGE_SIZE_DEFAULT) {
  const tp = Math.min(ADMIN_PAGE_SIZE_MAX, Math.max(1, Math.floor(tamanhoPagina)));
  const p = Math.max(1, Math.floor(pagina));
  return { pagina: p, tamanhoPagina: tp, from: (p - 1) * tp, to: p * tp - 1 };
}

/**
 * Versão paginada e com busca server-side da listagem admin de conteúdo.
 * Faz uma única ida ao banco com `count: "exact"`.
 */
export async function fetchConteudosAdminPaginated(
  filters: ConteudosAdminFilters = {},
): Promise<ConteudosAdminPage> {
  const pag = clampPagina(filters.pagina, filters.tamanhoPagina);

  let q = supabase
    .from("conteudo_tea")
    .select(CONTEUDO_ADMIN_SELECT, { count: "exact" })
    .order("criado_em", { ascending: false })
    .range(pag.from, pag.to);

  if (filters.busca && filters.busca.trim()) {
    const term = filters.busca.trim().replace(/[,()]/g, " ");
    q = q.or(`titulo.ilike.%${term}%,slug.ilike.%${term}%,autor.ilike.%${term}%`);
  }
  if (filters.categoria) q = q.eq("categoria", filters.categoria);
  if (filters.publicado !== undefined) q = q.eq("publicado", filters.publicado);

  const { data, error, count } = await q.returns<ConteudoAdminRow[]>();
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

/** Filtros aceitos pela listagem paginada de reservas admin. */
export interface ReservasAdminFilters {
  /** Texto livre — busca em mensagem (ilike). Para campos de tabelas
   * embutidas (estabelecimentos.nome, familia_profiles.email) o filtro
   * **complementar** acontece no cliente sobre a página atual. */
  busca?: string;
  /** Filtra por status (omita para todos). */
  status?: Database["public"]["Enums"]["reserva_status"];
  /** Data mínima de check-in (YYYY-MM-DD, inclusivo). */
  checkinDe?: string;
  /** Data máxima de check-in (YYYY-MM-DD, inclusivo). */
  checkinAte?: string;
  /** Data mínima de criação (YYYY-MM-DD, inclusivo, hora 00:00). */
  criadoDe?: string;
  /** Data máxima de criação (YYYY-MM-DD, inclusivo até 23:59:59). */
  criadoAte?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface ReservasAdminPage {
  items: ReservaAdminRow[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

/**
 * Versão paginada da listagem admin de reservas. Faz busca server-side
 * por `mensagem` (ilike), `status` (eq) e intervalos de data — tanto
 * `data_checkin` (date) quanto `criado_em` (timestamptz, com clamp para
 * fim do dia em `criadoAte`). Filtros adicionais por dados embutidos
 * (`estabelecimentos.nome`, `familia_profiles.*`) permanecem opcionais
 * no caller, sobre a página retornada.
 */
export async function fetchReservasAdminPaginated(
  filters: ReservasAdminFilters = {},
): Promise<ReservasAdminPage> {
  const pag = clampPagina(filters.pagina, filters.tamanhoPagina);

  let q = supabase
    .from("reservas")
    .select(RESERVA_ADMIN_SELECT, { count: "exact" })
    .order("criado_em", { ascending: false })
    .range(pag.from, pag.to);

  if (filters.status) q = q.eq("status", filters.status);
  if (filters.busca && filters.busca.trim()) {
    const term = filters.busca.trim().replace(/[,()]/g, " ");
    q = q.ilike("mensagem", `%${term}%`);
  }
  if (filters.checkinDe) q = q.gte("data_checkin", filters.checkinDe);
  if (filters.checkinAte) q = q.lte("data_checkin", filters.checkinAte);
  if (filters.criadoDe) {
    q = q.gte("criado_em", `${filters.criadoDe}T00:00:00`);
  }
  if (filters.criadoAte) {
    // inclusivo até o fim do dia
    q = q.lte("criado_em", `${filters.criadoAte}T23:59:59.999`);
  }

  const { data, error, count } = await q.returns<ReservaAdminRow[]>();
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
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contagem global por status — usada no painel de filtros para mostrar
 * o total real (todas as páginas) sem precisar carregar todas as linhas.
 *
 * Faz uma query `head: true` por status em paralelo + uma `total` geral.
 * Sempre retorna todas as chaves (0 quando não há linhas).
 */
export async function fetchReservasAdminStatusCounts(): Promise<{
  todas: number;
  pendente: number;
  confirmada: number;
  cancelada: number;
  concluida: number;
}> {
  const [todas, pendente, confirmada, cancelada, concluida] = await Promise.all([
    supabase.from("reservas").select("id", { count: "exact", head: true }),
    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente"),
    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmada"),
    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelada"),
    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("status", "concluida"),
  ]);
  return {
    todas: todas.count ?? 0,
    pendente: pendente.count ?? 0,
    confirmada: confirmada.count ?? 0,
    cancelada: cancelada.count ?? 0,
    concluida: concluida.count ?? 0,
  };
}

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

/**
 * Busca, em uma única query, o **último log com observação não-vazia**
 * de cada reserva da lista. Usado pela tabela admin para mostrar um
 * indicador truncado da observação mais recente sem fazer N+1 fetches.
 *
 * Retorna um Map(reserva_id → log) — ausência de chave significa que
 * a reserva ainda não tem observação registrada.
 */
export async function fetchUltimaObservacaoPorReservas(
  reservaIds: ReadonlyArray<string>,
): Promise<Map<string, AuditoriaRow>> {
  const out = new Map<string, AuditoriaRow>();
  if (reservaIds.length === 0) return out;

  const { data, error } = await supabase
    .from("reservas_auditoria")
    .select("*")
    .in("reserva_id", [...reservaIds])
    .not("observacao", "is", null)
    .order("criado_em", { ascending: false })
    .returns<AuditoriaRow[]>();

  if (error) throw error;
  // Como vem desc por data, o primeiro encontrado por reserva é o mais recente.
  for (const log of data ?? []) {
    if (!out.has(log.reserva_id)) out.set(log.reserva_id, log);
  }
  return out;
}

/** Filtros aceitos pela listagem paginada da auditoria de reservas. */
export interface AuditoriaAdminFilters {
  /** Busca livre — case-insensitive em `ator_email`, `acao`, `observacao`. */
  busca?: string;
  /** ISO inicial (`>=`) de `criado_em`. */
  desde?: string;
  /** ISO final (`<=`) de `criado_em`. */
  ate?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface AuditoriaAdminPage {
  items: AuditoriaRow[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

/**
 * Versão paginada da auditoria de reservas — uma única ida ao banco
 * com `count: "exact"`. Filtros de data e busca são server-side.
 */
export async function fetchAuditoriaAdminPaginated(
  filters: AuditoriaAdminFilters = {},
): Promise<AuditoriaAdminPage> {
  const pag = clampPagina(filters.pagina, filters.tamanhoPagina);

  let q = supabase
    .from("reservas_auditoria")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range(pag.from, pag.to);

  if (filters.desde) q = q.gte("criado_em", filters.desde);
  if (filters.ate) q = q.lte("criado_em", filters.ate);
  if (filters.busca && filters.busca.trim()) {
    const term = filters.busca.trim().replace(/[,()]/g, " ");
    q = q.or(
      `ator_email.ilike.%${term}%,acao.ilike.%${term}%,observacao.ilike.%${term}%,reserva_id.eq.${isUuid(term) ? term : "00000000-0000-0000-0000-000000000000"}`,
    );
  }

  const { data, error, count } = await q.returns<AuditoriaRow[]>();
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

/** Heurística simples — evita injetar termos não-UUID no `eq.` de `reserva_id`. */
function isUuid(s: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Auditoria de estabelecimentos (diff campo a campo via trigger no banco)
// ─────────────────────────────────────────────────────────────────────────────

export type EstabAuditoriaRow = Tables<"estabelecimentos_auditoria">;

/** Histórico completo de um estabelecimento, mais recente primeiro. */
export async function fetchAuditoriaPorEstabelecimento(
  estabelecimentoId: string,
  limit = 200,
): Promise<EstabAuditoriaRow[]> {
  const { data, error } = await supabase
    .from("estabelecimentos_auditoria")
    .select("*")
    .eq("estabelecimento_id", estabelecimentoId)
    .order("criado_em", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Filtros aceitos pela listagem global de auditoria de estabelecimentos. */
export interface EstabAuditoriaAdminFilters {
  /** Busca livre — case-insensitive em ator_email, campo, nome do estabelecimento. */
  busca?: string;
  /** ISO inicial (`>=`) de `criado_em`. */
  desde?: string;
  /** ISO final (`<=`) de `criado_em`. */
  ate?: string;
  /** Filtra por ação. */
  acao?: "criado" | "editado" | "excluido";
  pagina?: number;
  tamanhoPagina?: number;
}

export interface EstabAuditoriaAdminPage {
  items: EstabAuditoriaRow[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

/**
 * Versão paginada e global da auditoria de estabelecimentos. Mesmo padrão
 * de `fetchAuditoriaAdminPaginated` (reservas), com filtros server-side.
 */
export async function fetchEstabAuditoriaAdminPaginated(
  filters: EstabAuditoriaAdminFilters = {},
): Promise<EstabAuditoriaAdminPage> {
  const pag = clampPagina(filters.pagina, filters.tamanhoPagina);

  let q = supabase
    .from("estabelecimentos_auditoria")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range(pag.from, pag.to);

  if (filters.desde) q = q.gte("criado_em", filters.desde);
  if (filters.ate) q = q.lte("criado_em", filters.ate);
  if (filters.acao) q = q.eq("acao", filters.acao);
  if (filters.busca && filters.busca.trim()) {
    const term = filters.busca.trim().replace(/[,()]/g, " ");
    q = q.or(
      `ator_email.ilike.%${term}%,campo.ilike.%${term}%,estabelecimento_nome.ilike.%${term}%,estabelecimento_id.eq.${isUuid(term) ? term : "00000000-0000-0000-0000-000000000000"}`,
    );
  }

  const { data, error, count } = await q.returns<EstabAuditoriaRow[]>();
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

/** Lista artigos publicados (inclui agendados cuja data já chegou). */
export async function fetchConteudosPublicados(
  filters: { categoria?: ConteudoCategoria; limite?: number } = {},
): Promise<ConteudoCard[]> {
  let q = supabase
    .from("conteudo_tea")
    .select(CONTEUDO_CARD_SELECT)
    .or(filtroConteudoPublico())
    .order("criado_em", { ascending: false });
  if (filters.categoria) q = q.eq("categoria", filters.categoria);
  if (filters.limite) q = q.limit(filters.limite);
  const { data, error } = await q.returns<ConteudoCard[]>();
  if (error) throw error;
  return data ?? [];
}

/** Busca um artigo público por slug (publicado OU agendado vencido). */
export async function fetchConteudoPorSlug(slug: string): Promise<ConteudoPublico | null> {
  const { data, error } = await supabase
    .from("conteudo_tea")
    .select("*")
    .eq("slug", slug)
    .or(filtroConteudoPublico())
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
    .or(filtroConteudoPublico())
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