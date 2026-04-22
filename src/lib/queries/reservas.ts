/**
 * Queries tipadas para `reservas`, incluindo joins compostos
 * (estabelecimento + perfil sensorial) reutilizáveis em
 * /minha-conta/reservas e no painel admin.
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
  perfil_sensorial: Pick<
    Tables<"perfil_sensorial">,
    "id" | "nome_autista" | "nivel_tea"
  > | null;
};

const SELECT = `
  *,
  estabelecimentos(id, slug, nome, cidade, estado, foto_capa, tipo),
  perfil_sensorial(id, nome_autista, nivel_tea)
` as const;

/** Reservas da família logada, ordenadas por data desc. */
export async function fetchReservasDaFamilia(
  familiaId: string,
): Promise<ReservaComContexto[]> {
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
  const { data, error } = await supabase
    .from("reservas")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
