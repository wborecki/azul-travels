/**
 * Queries tipadas para `perfil_sensorial`.
 *
 * Uma família pode ter N Perfis TEA (um por pessoa autista), cada um com foto própria
 * (bucket `perfis-tea-fotos`, pasta `<familia_id>/`).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PerfilSensorial = Tables<"perfil_sensorial">;
export type PerfilSensorialInsert = TablesInsert<"perfil_sensorial">;
export type PerfilSensorialUpdate = TablesUpdate<"perfil_sensorial">;

/** Subconjunto usado em selectors de reserva. */
export type PerfilOption = Pick<PerfilSensorial, "id" | "nome_autista" | "idade" | "foto_url">;

const PERFIL_OPTION_SELECT = "id, nome_autista, idade, foto_url" as const;

/** Lista os perfis sensoriais de uma família (forma leve para selects). */
export async function fetchPerfisDaFamilia(familiaId: string): Promise<PerfilOption[]> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select(PERFIL_OPTION_SELECT)
    .eq("familia_id", familiaId)
    .order("nome_autista")
    .returns<PerfilOption[]>();

  if (error) throw error;
  return data ?? [];
}

/** Lista completa de perfis (para edição em /minha-conta/perfil). */
export async function fetchPerfisCompletos(familiaId: string): Promise<PerfilSensorial[]> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select("*")
    .eq("familia_id", familiaId)
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Cria um novo perfil sensorial e devolve a row completa. */
export async function criarPerfilSensorial(
  payload: PerfilSensorialInsert,
): Promise<PerfilSensorial> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/** Atualiza um perfil existente da família e devolve a row completa. */
export async function atualizarPerfilSensorial(
  perfilId: string,
  payload: PerfilSensorialUpdate,
): Promise<PerfilSensorial> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .update(payload)
    .eq("id", perfilId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/** Exclui um perfil da família (vínculos em reserva_perfis caem em cascata). */
export async function excluirPerfilSensorial(perfilId: string): Promise<void> {
  const { error } = await supabase.from("perfil_sensorial").delete().eq("id", perfilId);
  if (error) throw error;
}

/**
 * Sobe a foto de um perfil para o bucket `perfis-tea-fotos` (pasta da
 * família, exigida pela policy de storage) e devolve a URL pública.
 */
export async function uploadFotoPerfil(familiaId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${familiaId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("perfis-tea-fotos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("perfis-tea-fotos").getPublicUrl(path);
  return data.publicUrl;
}

/** Nome do responsável em `familia_profiles` (ou `null` se não cadastrado). */
export async function fetchNomeResponsavelDaFamilia(familiaId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("familia_profiles")
    .select("nome_responsavel")
    .eq("id", familiaId)
    .maybeSingle();

  if (error) throw error;
  return data?.nome_responsavel ?? null;
}

/** Indica se a família já preencheu ao menos um perfil sensorial. */
export async function fetchTemPerfilSensorial(familiaId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select("id")
    .eq("familia_id", familiaId)
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}
