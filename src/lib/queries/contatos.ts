
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export type ContatoGeralInsert = TablesInsert<"contatos_gerais">;

export async function criarContatoGeral(input: ContatoGeralInsert): Promise<void> {
  const { error } = await supabase.from("contatos_gerais").insert(input);
  if (error) throw error;
}
