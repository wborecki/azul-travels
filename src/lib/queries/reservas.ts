/**
 * Queries tipadas para `reservas`, incluindo joins compostos
 * (estabelecimento + perfil sensorial) reutilizáveis em
 * /minha-conta/reservas e no painel admin.
 *
 * Esta camada é o **único ponto** que monta `TablesInsert<"reservas">`.
 * Componentes nunca devem construir esse payload na mão - devem usar
 * `buildReservaPayload(formInput)` para garantir:
 *   - tipos exatos das colunas (string | null, number | null, enum…)
 *   - sanitização única (trim de mensagem, datas vazias → null)
 *   - zero `as`/coerção espalhada nas rotas
 *
 * Os guards em `src/integrations/supabase/types.guard.ts` travam o build
 * se o shape divergir.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Reserva = Tables<"reservas">;
export type ReservaInsert = TablesInsert<"reservas">;

/** Perfil leve embutido em reservas (via coluna legada ou reserva_perfis). */
export type PerfilDaReserva = Pick<
  Tables<"perfil_sensorial">,
  "id" | "nome_autista" | "nivel_tea" | "idade" | "foto_url"
>;

/** Reserva enriquecida com dados leves do estabelecimento, item e perfis. */
export type ReservaComContexto = Reserva & {
  estabelecimentos: Pick<
    Tables<"estabelecimentos">,
    | "id"
    | "slug"
    | "nome"
    | "cidade"
    | "estado"
    | "foto_capa"
    | "tipo"
    | "endereco"
    | "telefone"
    | "tem_sala_sensorial"
    | "tem_concierge_tea"
    | "tem_checkin_antecipado"
    | "tem_fila_prioritaria"
    | "tem_cardapio_visual"
    | "tem_caa"
    | "tem_beneficio_tea"
    | "beneficio_tea_descricao"
  > | null;
  itens_reservaveis: Tables<"itens_reservaveis"> | null;
  perfil_sensorial: PerfilDaReserva | null;
  reserva_perfis: Array<{ perfil_sensorial: PerfilDaReserva | null }>;
};

const SELECT = `
  *,
  estabelecimentos(id, slug, nome, cidade, estado, foto_capa, tipo, endereco, telefone,
    tem_sala_sensorial, tem_concierge_tea, tem_checkin_antecipado, tem_fila_prioritaria,
    tem_cardapio_visual, tem_caa, tem_beneficio_tea, beneficio_tea_descricao),
  itens_reservaveis(*),
  perfil_sensorial!reservas_perfil_sensorial_id_fkey(id, nome_autista, nivel_tea, idade, foto_url),
  reserva_perfis(perfil_sensorial(id, nome_autista, nivel_tea, idade, foto_url))
` as const;

/**
 * Perfis vinculados a uma reserva, unificando a coluna legada
 * `perfil_sensorial_id` (reservas antigas) com a join table
 * `reserva_perfis` (reservas novas, N perfis), sem duplicar.
 */
export function perfisDaReserva(reserva: {
  perfil_sensorial: PerfilDaReserva | null;
  reserva_perfis: Array<{ perfil_sensorial: PerfilDaReserva | null }>;
}): PerfilDaReserva[] {
  const vistos = new Set<string>();
  const lista: PerfilDaReserva[] = [];
  for (const rp of reserva.reserva_perfis) {
    if (rp.perfil_sensorial && !vistos.has(rp.perfil_sensorial.id)) {
      vistos.add(rp.perfil_sensorial.id);
      lista.push(rp.perfil_sensorial);
    }
  }
  if (reserva.perfil_sensorial && !vistos.has(reserva.perfil_sensorial.id)) {
    lista.push(reserva.perfil_sensorial);
  }
  return lista;
}

/** Reservas da família logada, ordenadas por data desc. */
export async function fetchReservasDaFamilia(familiaId: string): Promise<ReservaComContexto[]> {
  const { data, error } = await supabase
    .from("reservas")
    .select(SELECT)
    .eq("familia_id", familiaId)
    .order("criado_em", { ascending: false })
    .returns<ReservaComContexto[]>();

  if (error) throw error;
  return data ?? [];
}

/**
 * Reservas da família logada para um estabelecimento específico, ordenadas
 * por data desc. Usado no card de confirmação da página de detalhe para
 * mostrar o histórico desta família neste local.
 */
export async function fetchReservasDaFamiliaPorEstabelecimento(
  familiaId: string,
  estabelecimentoId: string,
): Promise<ReservaComContexto[]> {
  const { data, error } = await supabase
    .from("reservas")
    .select(SELECT)
    .eq("familia_id", familiaId)
    .eq("estabelecimento_id", estabelecimentoId)
    .order("criado_em", { ascending: false })
    .returns<ReservaComContexto[]>();

  if (error) throw error;
  return data ?? [];
}

/** Uma reserva específica da família logada (dono), ou `null` se não encontrada. */
export async function fetchReservaDaFamiliaPorId(
  reservaId: string,
  familiaId: string,
): Promise<ReservaComContexto | null> {
  const { data, error } = await supabase
    .from("reservas")
    .select(SELECT)
    .eq("id", reservaId)
    .eq("familia_id", familiaId)
    .maybeSingle()
    .returns<ReservaComContexto | null>();

  if (error) throw error;
  return data;
}

/** Cria uma nova reserva (payload tipado). */
export async function criarReserva(payload: ReservaInsert): Promise<Reserva> {
  const { data, error } = await supabase.from("reservas").insert(payload).select("*").single();

  if (error) throw error;
  return data;
}

/**
 * Vincula N perfis sensoriais a uma reserva recém-criada (join table
 * `reserva_perfis`). Idempotente por PK composta — chamadas repetidas com os
 * mesmos ids não duplicam.
 */
export async function vincularPerfisAReserva(
  reservaId: string,
  perfilIds: string[],
): Promise<void> {
  if (perfilIds.length === 0) return;
  const { error } = await supabase.from("reserva_perfis").upsert(
    perfilIds.map((perfilSensorialId) => ({
      reserva_id: reservaId,
      perfil_sensorial_id: perfilSensorialId,
    })),
    { onConflict: "reserva_id,perfil_sensorial_id", ignoreDuplicates: true },
  );

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form ↔ Insert: ponte tipada usada pelo formulário de reserva
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Entrada **bruta** do formulário, derivada do próprio `ReservaInsert`.
 *
 * - Campos obrigatórios para a UI virar um insert válido (família,
 *   estabelecimento, perfil sensorial) são `NonNullable`.
 * - Datas vêm como `string` do `<input type="date">` - strings vazias
 *   são tratadas como ausência (→ `null`) por `buildReservaPayload`.
 * - `mensagem` é trimada; vazio também vira `null`.
 *
 * Mantém os tipos das colunas do Supabase (`Reserva["data_checkin"]`,
 * `Reserva["num_adultos"]`…) para que qualquer mudança no schema quebre
 * o build aqui - não dentro de uma rota.
 */
export interface ReservaFormInput {
  familia_id: NonNullable<ReservaInsert["familia_id"]>;
  estabelecimento_id: NonNullable<ReservaInsert["estabelecimento_id"]>;
  item_reservavel_id: NonNullable<ReservaInsert["item_reservavel_id"]>;
  /** Vínculo ao Perfil TEA permanente da família (preferencial). */
  perfil_tea_id?: ReservaInsert["perfil_tea_id"];
  /** Mantido por compat. com pré-cadastros antigos. Pode ser null. */
  perfil_sensorial_id: ReservaInsert["perfil_sensorial_id"];
  data_checkin: string;
  data_checkout: string;
  num_adultos: NonNullable<Reserva["num_adultos"]>;
  num_autistas: NonNullable<Reserva["num_autistas"]>;
  mensagem: string;
  perfil_enviado_ao_estabelecimento: NonNullable<Reserva["perfil_enviado_ao_estabelecimento"]>;
  // Campos opcionais específicos da reserva (smart pre-checkin)
  num_acompanhantes?: number | null;
  pessoa_referencia?: string | null;
  objetivo_viagem?: string[];
  notas_especificas?: string | null;
  historico_negativo?: string | null;
  recomendacoes_adicionais?: string | null;
  conversa_previa_equipe?: boolean;
}

/** Trim de string; vazio vira `null`. Idêntico ao usado em mídia. */
function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * Monta o `ReservaInsert` final a partir do form, sem `as`/coerção.
 * Esta é a **única** função autorizada a construir esse payload.
 */
export function buildReservaPayload(input: ReservaFormInput): ReservaInsert {
  return {
    familia_id: input.familia_id,
    estabelecimento_id: input.estabelecimento_id,
    item_reservavel_id: input.item_reservavel_id,
    perfil_tea_id: input.perfil_tea_id ?? null,
    perfil_sensorial_id: input.perfil_sensorial_id ?? null,
    data_checkin: emptyToNull(input.data_checkin),
    data_checkout: emptyToNull(input.data_checkout),
    num_adultos: input.num_adultos,
    num_autistas: input.num_autistas,
    mensagem: emptyToNull(input.mensagem),
    status: "pendente",
    perfil_enviado_ao_estabelecimento: input.perfil_enviado_ao_estabelecimento,
    num_acompanhantes: input.num_acompanhantes ?? null,
    pessoa_referencia: input.pessoa_referencia ? emptyToNull(input.pessoa_referencia) : null,
    objetivo_viagem: input.objetivo_viagem ?? [],
    notas_especificas: input.notas_especificas ? emptyToNull(input.notas_especificas) : null,
    historico_negativo: input.historico_negativo ? emptyToNull(input.historico_negativo) : null,
    recomendacoes_adicionais: input.recomendacoes_adicionais
      ? emptyToNull(input.recomendacoes_adicionais)
      : null,
    conversa_previa_equipe: input.conversa_previa_equipe ?? false,
  };
}
