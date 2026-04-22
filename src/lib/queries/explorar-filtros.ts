/**
 * Filtros padrão de exploração — preferências persistidas por usuário.
 *
 * Cada família guarda **um único** conjunto favorito (1:1 com `auth.users`)
 * de tipos / selos / recursos sensoriais. A página `/explorar` reaplica
 * esse conjunto automaticamente quando o usuário entra "limpo" (sem query
 * string relevante).
 *
 * Decisões importantes:
 *  - **Não** salva busca textual, estado, ordenação ou toggles — esses
 *    são voláteis e mudam a cada sessão. Salvar capturaria contexto
 *    irrelevante.
 *  - RLS no banco já restringe acesso ao próprio `user_id`; o helper
 *    apenas chama o client autenticado.
 *  - Selos/recursos são `text[]` no banco (não enums), porque os literais
 *    coincidem com as colunas boolean da tabela `estabelecimentos` —
 *    não há um enum dedicado. A validação de domínio é feita na UI.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import type { EstabelecimentoFull } from "./estabelecimentos";

export type ExplorarFiltrosPadrao = Tables<"explorar_filtros_padrao">;
export type ExplorarFiltrosPadraoInsert = TablesInsert<"explorar_filtros_padrao">;

/** Subconjunto exposto para a UI — só o que de fato é reaplicado. */
export interface FiltrosPadraoUI {
  tipos: ReadonlyArray<EstabelecimentoFull["tipo"]>;
  selos: ReadonlyArray<string>;
  recursos: ReadonlyArray<string>;
}

/**
 * Lê o filtro padrão do usuário autenticado. Retorna `null` quando
 * não há registro (primeira visita ou usuário que ainda não salvou).
 */
export async function fetchFiltrosPadrao(userId: string): Promise<FiltrosPadraoUI | null> {
  const { data, error } = await supabase
    .from("explorar_filtros_padrao")
    .select("tipos, selos, recursos")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    tipos: data.tipos ?? [],
    selos: data.selos ?? [],
    recursos: data.recursos ?? [],
  };
}

/**
 * Cria/atualiza o filtro padrão (upsert por `user_id`).
 * Idempotente — chamar duas vezes com os mesmos valores não duplica.
 */
export async function salvarFiltrosPadrao(
  userId: string,
  filtros: FiltrosPadraoUI,
): Promise<void> {
  const payload: ExplorarFiltrosPadraoInsert = {
    user_id: userId,
    tipos: [...filtros.tipos],
    selos: [...filtros.selos],
    recursos: [...filtros.recursos],
  };
  const { error } = await supabase
    .from("explorar_filtros_padrao")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

/** Apaga o filtro padrão. Volta a `/explorar` ao comportamento default. */
export async function limparFiltrosPadrao(userId: string): Promise<void> {
  const { error } = await supabase
    .from("explorar_filtros_padrao")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

/** True quando ao menos uma das três listas tem item. */
export function temFiltrosSalvos(f: FiltrosPadraoUI | null): f is FiltrosPadraoUI {
  return !!f && (f.tipos.length > 0 || f.selos.length > 0 || f.recursos.length > 0);
}
