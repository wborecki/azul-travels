import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type OpcaoBloqueio = Tables<"opcao_bloqueios">;
export type OpcaoBloqueioInsert = TablesInsert<"opcao_bloqueios">;

export async function fetchBloqueiosDaOpcao(opcaoReservaId: string): Promise<OpcaoBloqueio[]> {
  const { data, error } = await supabase
    .from("opcao_bloqueios")
    .select("*")
    .eq("opcao_reserva_id", opcaoReservaId)
    .order("inicio", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function criarOpcaoBloqueio(payload: OpcaoBloqueioInsert): Promise<OpcaoBloqueio> {
  const { data, error } = await supabase
    .from("opcao_bloqueios")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function excluirOpcaoBloqueio(id: string): Promise<void> {
  const { error } = await supabase.from("opcao_bloqueios").delete().eq("id", id);
  if (error) throw error;
}
