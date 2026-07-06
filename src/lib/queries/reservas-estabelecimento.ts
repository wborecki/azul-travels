import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ReservaStatus } from "@/lib/enums";
import type { Reserva } from "./reservas";

export type ReservaEstabelecimentoRow = Reserva & {
  familia_profiles: Pick<
    Tables<"familia_profiles">,
    "id" | "nome_responsavel" | "email" | "telefone" | "cidade" | "estado"
  > | null;
  perfil_sensorial: Tables<"perfil_sensorial"> | null;
  perfil_tea: Tables<"perfil_tea"> | null;
};

const RESERVA_ESTAB_SELECT = `
  *,
  familia_profiles(id, nome_responsavel, email, telefone, cidade, estado),
  perfil_sensorial(*),
  perfil_tea(*)
` as const;

export async function fetchReservasDoEstabelecimento(
  estabelecimentoId: string,
): Promise<ReservaEstabelecimentoRow[]> {
  const { data, error } = await supabase
    .from("reservas")
    .select(RESERVA_ESTAB_SELECT)
    .eq("estabelecimento_id", estabelecimentoId)
    .order("criado_em", { ascending: false })
    .returns<ReservaEstabelecimentoRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchReservaDoEstabelecimentoPorId(
  reservaId: string,
): Promise<ReservaEstabelecimentoRow | null> {
  const { data, error } = await supabase
    .from("reservas")
    .select(RESERVA_ESTAB_SELECT)
    .eq("id", reservaId)
    .returns<ReservaEstabelecimentoRow[]>();

  if (error) throw error;
  return data?.[0] ?? null;
}

export async function atualizarStatusReservaEstabelecimento(
  reservaId: string,
  status: ReservaStatus,
): Promise<Reserva> {
  const { data, error } = await supabase
    .from("reservas")
    .update({ status })
    .eq("id", reservaId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Registra a ação do dono do estabelecimento em `reservas_auditoria`.
 * `ator_role` não é enviado - é recalculado por trigger a partir de
 * fatos do banco (nunca confia no client).
 */
export async function registrarAuditoriaReservaEstabelecimento(params: {
  reservaId: string;
  atorId: string;
  atorEmail: string | null;
  acao: string;
  statusAnterior: ReservaStatus;
  statusNovo: ReservaStatus;
  observacao: string | null;
}): Promise<void> {
  const { error } = await supabase.from("reservas_auditoria").insert({
    reserva_id: params.reservaId,
    ator_id: params.atorId,
    ator_email: params.atorEmail,
    acao: params.acao,
    status_anterior: params.statusAnterior,
    status_novo: params.statusNovo,
    observacao: params.observacao,
  });

  if (error) throw error;
}
