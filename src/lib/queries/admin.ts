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

// ─────────────────────────────────────────────────────────────────────────────
// Estabelecimentos — listagem admin
// ─────────────────────────────────────────────────────────────────────────────

/** Subset enxuto exibido na tabela `/admin/estabelecimentos`. */
export type EstabAdminRow = Pick<
  Tables<"estabelecimentos">,
  "id" | "nome" | "slug" | "tipo" | "cidade" | "estado" | "status" | "destaque" | "criado_em"
>;

const ESTAB_ADMIN_SELECT =
  "id, nome, slug, tipo, cidade, estado, status, destaque, criado_em" as const;

/** Lista até `limit` estabelecimentos para o painel admin (qualquer status). */
export async function fetchEstabelecimentosAdmin(limit = 200): Promise<EstabAdminRow[]> {
  const { data, error } = await supabase
    .from("estabelecimentos")
    .select(ESTAB_ADMIN_SELECT)
    .order("criado_em", { ascending: false })
    .limit(limit)
    .returns<EstabAdminRow[]>();
  if (error) throw error;
  return data ?? [];
}

/** Busca uma row completa para o form de edição. */
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
