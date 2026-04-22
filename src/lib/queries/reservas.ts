/**
 * Queries tipadas para `reservas`, incluindo joins compostos
 * (estabelecimento + perfil sensorial) reutilizáveis em
 * /minha-conta/reservas e no painel admin.
 *
 * Esta camada é o **único ponto** que monta `TablesInsert<"reservas">`.
 * Componentes nunca devem construir esse payload na mão — devem usar
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

/** Reserva enriquecida com dados leves do estabelecimento e perfil. */
export type ReservaComContexto = Reserva & {
  estabelecimentos: Pick<
    Tables<"estabelecimentos">,
    "id" | "slug" | "nome" | "cidade" | "estado" | "foto_capa" | "tipo"
  > | null;
  perfil_sensorial: Pick<Tables<"perfil_sensorial">, "id" | "nome_autista" | "nivel_tea"> | null;
};

const SELECT = `
  *,
  estabelecimentos(id, slug, nome, cidade, estado, foto_capa, tipo),
  perfil_sensorial(id, nome_autista, nivel_tea)
` as const;

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

/** Cria uma nova reserva (payload tipado). */
export async function criarReserva(payload: ReservaInsert): Promise<Reserva> {
  const { data, error } = await supabase.from("reservas").insert(payload).select("*").single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form ↔ Insert: ponte tipada usada pelo formulário de reserva
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Entrada **bruta** do formulário, derivada do próprio `ReservaInsert`.
 *
 * - Campos obrigatórios para a UI virar um insert válido (família,
 *   estabelecimento, perfil sensorial) são `NonNullable`.
 * - Datas vêm como `string` do `<input type="date">` — strings vazias
 *   são tratadas como ausência (→ `null`) por `buildReservaPayload`.
 * - `mensagem` é trimada; vazio também vira `null`.
 *
 * Mantém os tipos das colunas do Supabase (`Reserva["data_checkin"]`,
 * `Reserva["num_adultos"]`…) para que qualquer mudança no schema quebre
 * o build aqui — não dentro de uma rota.
 */
export interface ReservaFormInput {
  familia_id: NonNullable<ReservaInsert["familia_id"]>;
  estabelecimento_id: NonNullable<ReservaInsert["estabelecimento_id"]>;
  perfil_sensorial_id: NonNullable<ReservaInsert["perfil_sensorial_id"]>;
  data_checkin: string;
  data_checkout: string;
  num_adultos: NonNullable<Reserva["num_adultos"]>;
  num_autistas: NonNullable<Reserva["num_autistas"]>;
  mensagem: string;
  perfil_enviado_ao_estabelecimento: NonNullable<Reserva["perfil_enviado_ao_estabelecimento"]>;
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
    perfil_sensorial_id: input.perfil_sensorial_id,
    data_checkin: emptyToNull(input.data_checkin),
    data_checkout: emptyToNull(input.data_checkout),
    num_adultos: input.num_adultos,
    num_autistas: input.num_autistas,
    mensagem: emptyToNull(input.mensagem),
    status: "pendente",
    perfil_enviado_ao_estabelecimento: input.perfil_enviado_ao_estabelecimento,
  };
}
