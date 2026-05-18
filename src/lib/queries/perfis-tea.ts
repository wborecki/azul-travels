/**
 * Queries tipadas para `perfil_tea` - Perfil TEA permanente da família.
 * Uma família pode ter múltiplos perfis (um por filho autista).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PerfilTea = Tables<"perfil_tea">;
export type PerfilTeaInsert = TablesInsert<"perfil_tea">;
export type PerfilTeaUpdate = TablesUpdate<"perfil_tea">;

export type PerfilTeaResumo = Pick<
  PerfilTea,
  "id" | "nome_pessoa" | "idade" | "updated_at"
>;

/** Lista os perfis TEA da família, do mais recente ao mais antigo. */
export async function fetchPerfisTeaDaFamilia(userId: string): Promise<PerfilTea[]> {
  const { data, error } = await supabase
    .from("perfil_tea")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Busca um perfil TEA específico (RLS já restringe ao dono). */
export async function fetchPerfilTeaPorId(id: string): Promise<PerfilTea | null> {
  const { data, error } = await supabase
    .from("perfil_tea")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function criarPerfilTea(payload: PerfilTeaInsert): Promise<PerfilTea> {
  const { data, error } = await supabase
    .from("perfil_tea")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarPerfilTea(
  id: string,
  payload: PerfilTeaUpdate,
): Promise<PerfilTea> {
  const { data, error } = await supabase
    .from("perfil_tea")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removerPerfilTea(id: string): Promise<void> {
  const { error } = await supabase.from("perfil_tea").delete().eq("id", id);
  if (error) throw error;
}
