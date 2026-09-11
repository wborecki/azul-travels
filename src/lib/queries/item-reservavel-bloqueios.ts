import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type ItemReservavelBloqueio = Tables<"item_reservavel_bloqueios">;
export type ItemReservavelBloqueioInsert = TablesInsert<"item_reservavel_bloqueios">;

export async function fetchBloqueiosDoItem(
  itemReservavelId: string,
): Promise<ItemReservavelBloqueio[]> {
  const { data, error } = await supabase
    .from("item_reservavel_bloqueios")
    .select("*")
    .eq("item_reservavel_id", itemReservavelId)
    .order("inicio", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function criarItemReservavelBloqueio(
  payload: ItemReservavelBloqueioInsert,
): Promise<ItemReservavelBloqueio> {
  const { data, error } = await supabase
    .from("item_reservavel_bloqueios")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function excluirItemReservavelBloqueio(id: string): Promise<void> {
  const { error } = await supabase.from("item_reservavel_bloqueios").delete().eq("id", id);
  if (error) throw error;
}
