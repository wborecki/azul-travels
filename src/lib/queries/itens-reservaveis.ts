import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ItemReservavel = Tables<"itens_reservaveis">;
export type ItemReservavelInsert = TablesInsert<"itens_reservaveis">;
export type ItemReservavelUpdate = TablesUpdate<"itens_reservaveis">;

export async function fetchItensDoEstabelecimento(
  estabelecimentoId: string,
): Promise<ItemReservavel[]> {
  const { data, error } = await supabase
    .from("itens_reservaveis")
    .select("*")
    .eq("estabelecimento_id", estabelecimentoId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchItemReservavelPorId(id: string): Promise<ItemReservavel | null> {
  const { data, error } = await supabase
    .from("itens_reservaveis")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function criarItemReservavel(payload: ItemReservavelInsert): Promise<ItemReservavel> {
  const { data, error } = await supabase
    .from("itens_reservaveis")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function atualizarItemReservavel(
  id: string,
  payload: ItemReservavelUpdate,
): Promise<ItemReservavel> {
  const { data, error } = await supabase
    .from("itens_reservaveis")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function excluirItemReservavel(id: string): Promise<void> {
  const { error } = await supabase.from("itens_reservaveis").delete().eq("id", id);
  if (error) throw error;
}
