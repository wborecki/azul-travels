/**
 * Query tipada de avaliações com join para `familia_profiles`.
 *
 * Centraliza o `select` para que toda a aplicação consuma o mesmo
 * payload tipado (sem `any`/`unknown`) — incluindo a página de
 * detalhe do estabelecimento.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/** Forma exata do payload retornado pela query (uma linha). */
export type AvaliacaoComFamilia = Tables<"avaliacoes"> & {
  familia_profiles: Pick<Tables<"familia_profiles">, "nome_responsavel"> | null;
};

const SELECT = "*, familia_profiles(nome_responsavel)" as const;

/** Avaliações públicas de um estabelecimento, ordenadas por data desc. */
export async function fetchAvaliacoesPublicasPorEstab(
  estabelecimentoId: string,
): Promise<AvaliacaoComFamilia[]> {
  const { data, error } = await supabase
    .from("avaliacoes")
    .select(SELECT)
    .eq("estabelecimento_id", estabelecimentoId)
    .eq("publica", true)
    .order("criado_em", { ascending: false })
    .returns<AvaliacaoComFamilia[]>();

  if (error) throw error;
  return data ?? [];
}
