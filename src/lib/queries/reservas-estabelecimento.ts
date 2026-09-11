import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ReservaStatus } from "@/lib/enums";
import type { Reserva } from "./reservas";

export type ReservaEstabelecimentoRow = Reserva & {
  familia_profiles: Pick<
    Tables<"familia_profiles">,
    "id" | "nome_responsavel" | "email" | "telefone" | "cidade" | "estado"
  > | null;
  itens_reservaveis: Tables<"itens_reservaveis"> | null;
  perfil_sensorial: Tables<"perfil_sensorial"> | null;
  reserva_perfis: Array<{ perfil_sensorial: Tables<"perfil_sensorial"> | null }>;
};

const RESERVA_ESTAB_SELECT = `
  *,
  familia_profiles(id, nome_responsavel, email, telefone, cidade, estado),
  itens_reservaveis(*),
  perfil_sensorial!reservas_perfil_sensorial_id_fkey(*),
  reserva_perfis(perfil_sensorial(*))
` as const;

/**
 * Perfis sensoriais vinculados à reserva: unifica a coluna legada
 * `perfil_sensorial_id` com a join table `reserva_perfis`, sem duplicar.
 */
export function perfisSensoriaisDaReservaEstab(
  reserva: ReservaEstabelecimentoRow,
): Array<Tables<"perfil_sensorial">> {
  const vistos = new Set<string>();
  const lista: Array<Tables<"perfil_sensorial">> = [];
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
