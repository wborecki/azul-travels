/**
 * Queries tipadas para `estabelecimentos`.
 *
 * Toda página que precisa de um estabelecimento (detalhe, listagem,
 * destaques, benefícios) consome estas funções para garantir o mesmo
 * shape tipado em toda a aplicação.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/** Linha completa de `estabelecimentos`, idêntica ao schema. */
export type Estabelecimento = Tables<"estabelecimentos">;

/** Subconjunto leve usado em cards de listagem. */
export type EstabelecimentoCard = Pick<
  Estabelecimento,
  | "id"
  | "slug"
  | "nome"
  | "tipo"
  | "cidade"
  | "estado"
  | "foto_capa"
  | "tour_360_url"
  | "selo_azul"
  | "selo_governamental"
  | "selo_privado"
  | "selo_privado_nome"
  | "tem_beneficio_tea"
  | "beneficio_tea_descricao"
  | "tem_sala_sensorial"
  | "tem_concierge_tea"
  | "tem_checkin_antecipado"
  | "tem_fila_prioritaria"
  | "tem_cardapio_visual"
  | "tem_caa"
  | "destaque"
>;

const CARD_SELECT = `
  id, slug, nome, tipo, cidade, estado, foto_capa, tour_360_url,
  selo_azul, selo_governamental, selo_privado, selo_privado_nome,
  tem_beneficio_tea, beneficio_tea_descricao,
  tem_sala_sensorial, tem_concierge_tea, tem_checkin_antecipado,
  tem_fila_prioritaria, tem_cardapio_visual, tem_caa, destaque
` as const;

/** Busca um estabelecimento ativo por slug (payload completo). */
export async function fetchEstabelecimentoPorSlug(
  slug: string,
): Promise<Estabelecimento | null> {
  const { data, error } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .eq("status", "ativo")
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Lista estabelecimentos ativos no formato leve de card. */
export async function fetchEstabelecimentosCards(opts?: {
  apenasDestaque?: boolean;
  apenasComBeneficio?: boolean;
  limite?: number;
}): Promise<EstabelecimentoCard[]> {
  let q = supabase
    .from("estabelecimentos")
    .select(CARD_SELECT)
    .eq("status", "ativo");

  if (opts?.apenasDestaque) q = q.eq("destaque", true);
  if (opts?.apenasComBeneficio) q = q.eq("tem_beneficio_tea", true);
  if (opts?.limite) q = q.limit(opts.limite);

  const { data, error } = await q.returns<EstabelecimentoCard[]>();
  if (error) throw error;
  return data ?? [];
}
