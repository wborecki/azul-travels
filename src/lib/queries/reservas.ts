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

// ─────────────────────────────────────────────────────────────────────────────
// Natureza de uma reserva já gravada
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `true` quando a reserva é uma visita (restaurante, parque, passeio) e não
 * uma estadia.
 *
 * O marcador é `hora_visita`, não a ausência de item: um quarto excluído
 * transforma estadias históricas em linhas sem `item_reservavel_id`
 * (`ON DELETE SET NULL`, migration 20260715220000), e essas continuam sendo
 * estadias. Só visita tem horário.
 */
export function reservaEhVisita(reserva: Pick<Reserva, "hora_visita">): boolean {
  return reserva.hora_visita !== null;
}

/** "20:00" a partir do `time` do Postgres, que vem como "20:00:00". */
export function formatHoraVisita(hora: string | null): string {
  return hora ? hora.slice(0, 5) : "";
}

/**
 * Período da reserva em uma linha, na forma certa para cada natureza:
 * `"12/07/2026 → 15/07/2026"` numa estadia, `"12/07/2026 às 20:00"` numa
 * visita. Usado por todas as telas que listam reservas, para a diferença
 * viver num lugar só.
 */
export function formatPeriodoReserva(
  reserva: Pick<Reserva, "data_checkin" | "data_checkout" | "hora_visita">,
  formatData: (d: string | null) => string,
): string {
  const dia = formatData(reserva.data_checkin);
  if (reservaEhVisita(reserva)) {
    const hora = formatHoraVisita(reserva.hora_visita);
    return hora ? `${dia} às ${hora}` : dia;
  }
  return `${dia} → ${formatData(reserva.data_checkout)}`;
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
interface ReservaFormBase {
  familia_id: NonNullable<ReservaInsert["familia_id"]>;
  estabelecimento_id: NonNullable<ReservaInsert["estabelecimento_id"]>;
  /** Vínculo ao Perfil TEA permanente da família (preferencial). */
  perfil_tea_id?: ReservaInsert["perfil_tea_id"];
  /** Mantido por compat. com pré-cadastros antigos. Pode ser null. */
  perfil_sensorial_id: ReservaInsert["perfil_sensorial_id"];
  data_checkin: string;
  num_adultos: NonNullable<Reserva["num_adultos"]>;
  num_autistas: NonNullable<Reserva["num_autistas"]>;
  mensagem: string;
  perfil_enviado_ao_estabelecimento: NonNullable<Reserva["perfil_enviado_ao_estabelecimento"]>;
  /**
   * Padrão `"pendente"` (pedido gratuito). A reserva paga entra como
   * `"aguardando_pagamento"` — quem define isso é a server function
   * `criarReservaComPagamento`, nunca um componente.
   */
  status?: NonNullable<ReservaInsert["status"]>;
  /** Congelados na criação da cobrança; nulos em reserva sem pagamento. */
  valor_total?: ReservaInsert["valor_total"];
  valor_comissao?: ReservaInsert["valor_comissao"];
  valor_repasse?: ReservaInsert["valor_repasse"];
  // Campos opcionais específicos da reserva (smart pre-checkin)
  num_acompanhantes?: number | null;
  pessoa_referencia?: string | null;
  objetivo_viagem?: string[];
  notas_especificas?: string | null;
  historico_negativo?: string | null;
  recomendacoes_adicionais?: string | null;
  conversa_previa_equipe?: boolean;
}

/**
 * Estadia: hospedagem, com um quarto escolhido e período de noites.
 * `data_checkin` é o check-in e `data_checkout` fecha o período.
 */
export interface ReservaEstadiaInput extends ReservaFormBase {
  natureza: "estadia";
  item_reservavel_id: NonNullable<ReservaInsert["item_reservavel_id"]>;
  data_checkout: string;
}

/**
 * Visita: restaurante, parque, passeio. Não há item a escolher - a família
 * reserva o próprio local, num dia e horário. `data_checkin` é o dia da
 * visita e `data_checkout` fica nulo, o que marca a natureza na linha.
 */
export interface ReservaVisitaInput extends ReservaFormBase {
  natureza: "visita";
  /** "HH:MM" do `<input type="time">`. */
  hora_visita: string;
}

/**
 * União discriminada pela natureza: montar uma visita com `data_checkout`, ou
 * uma estadia sem quarto, vira erro de compilação em vez de exceção vinda do
 * banco. A mesma regra é reimposta pela trigger
 * `sincronizar_estabelecimento_id_reserva`.
 */
export type ReservaFormInput = ReservaEstadiaInput | ReservaVisitaInput;

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
  const porNatureza =
    input.natureza === "estadia"
      ? {
          item_reservavel_id: input.item_reservavel_id,
          data_checkout: emptyToNull(input.data_checkout),
          hora_visita: null,
        }
      : {
          item_reservavel_id: null,
          data_checkout: null,
          hora_visita: emptyToNull(input.hora_visita),
        };

  return {
    ...porNatureza,
    familia_id: input.familia_id,
    estabelecimento_id: input.estabelecimento_id,
    perfil_tea_id: input.perfil_tea_id ?? null,
    perfil_sensorial_id: input.perfil_sensorial_id ?? null,
    data_checkin: emptyToNull(input.data_checkin),
    num_adultos: input.num_adultos,
    num_autistas: input.num_autistas,
    mensagem: emptyToNull(input.mensagem),
    status: input.status ?? "pendente",
    valor_total: input.valor_total ?? null,
    valor_comissao: input.valor_comissao ?? null,
    valor_repasse: input.valor_repasse ?? null,
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
