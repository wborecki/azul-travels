import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type OpcaoReserva = Tables<"opcoes_reserva">;
export type OpcaoReservaInsert = TablesInsert<"opcoes_reserva">;
export type OpcaoReservaUpdate = TablesUpdate<"opcoes_reserva">;

export async function fetchOpcoesDoEstabelecimento(
  estabelecimentoId: string,
): Promise<OpcaoReserva[]> {
  const { data, error } = await supabase
    .from("opcoes_reserva")
    .select("*")
    .eq("estabelecimento_id", estabelecimentoId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchOpcaoReservaPorId(id: string): Promise<OpcaoReserva | null> {
  const { data, error } = await supabase
    .from("opcoes_reserva")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function criarOpcaoReserva(payload: OpcaoReservaInsert): Promise<OpcaoReserva> {
  const { data, error } = await supabase
    .from("opcoes_reserva")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function atualizarOpcaoReserva(
  id: string,
  payload: OpcaoReservaUpdate,
): Promise<OpcaoReserva> {
  const { data, error } = await supabase
    .from("opcoes_reserva")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function excluirOpcaoReserva(id: string): Promise<void> {
  const { error } = await supabase.from("opcoes_reserva").delete().eq("id", id);
  if (error) throw error;
}
