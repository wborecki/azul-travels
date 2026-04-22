/**
 * Queries tipadas para `perfil_sensorial`.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PerfilSensorial = Tables<"perfil_sensorial">;
export type PerfilSensorialInsert = TablesInsert<"perfil_sensorial">;

/** Subconjunto usado em selectors de reserva. */
export type PerfilOption = Pick<PerfilSensorial, "id" | "nome_autista">;

/** Lista os perfis sensoriais de uma família (forma leve para selects). */
export async function fetchPerfisDaFamilia(familiaId: string): Promise<PerfilOption[]> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select("id, nome_autista")
    .eq("familia_id", familiaId)
    .order("nome_autista")
    .returns<PerfilOption[]>();

  if (error) throw error;
  return data ?? [];
}

/** Lista completa de perfis (para edição em /minha-conta/perfil-sensorial). */
export async function fetchPerfisCompletos(familiaId: string): Promise<PerfilSensorial[]> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select("*")
    .eq("familia_id", familiaId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
