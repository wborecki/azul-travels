/**
 * Queries tipadas para `estabelecimentos`.
 *
 * Payload unificado `EstabelecimentoView` reutilizado em:
 *   - listagem (/explorar)
 *   - cards (landing, destaques, benefícios)
 *   - detalhe (/estabelecimento/:slug)
 *
 * Mesmo SELECT, mesmo shape — sem duplicação. Para a página de
 * detalhe (que precisa de campos adicionais como descricao,
 * endereco, telefone, etc.), use `EstabelecimentoFull`.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/** Tipo completo da row, idêntico ao schema (usado no detalhe). */
export type EstabelecimentoFull = Tables<"estabelecimentos">;

/**
 * Shape unificado para listagem/card/detalhe-resumo.
 * Inclui: identificação, localização, capa, todos os selos,
 * Tour 360°, todos os recursos sensoriais, benefício TEA, destaque.
 */
export type EstabelecimentoView = Pick<
  EstabelecimentoFull,
  | "id"
  | "slug"
  | "nome"
  | "tipo"
  | "cidade"
  | "estado"
  | "foto_capa"
  // Tour 360°
  | "tour_360_url"
  // Selos
  | "selo_azul"
  | "selo_azul_validade"
  | "selo_governamental"
  | "selo_privado"
  | "selo_privado_nome"
  // Benefício TEA
  | "tem_beneficio_tea"
  | "beneficio_tea_descricao"
  // Recursos / flags sensoriais
  | "tem_sala_sensorial"
  | "tem_concierge_tea"
  | "tem_checkin_antecipado"
  | "tem_fila_prioritaria"
  | "tem_cardapio_visual"
  | "tem_caa"
  // Curadoria
  | "destaque"
>;

/** SELECT compartilhado — fonte única da verdade do payload de view. */
export const ESTAB_VIEW_SELECT = `
  id, slug, nome, tipo, cidade, estado, foto_capa,
  tour_360_url,
  selo_azul, selo_azul_validade, selo_governamental,
  selo_privado, selo_privado_nome,
  tem_beneficio_tea, beneficio_tea_descricao,
  tem_sala_sensorial, tem_concierge_tea, tem_checkin_antecipado,
  tem_fila_prioritaria, tem_cardapio_visual, tem_caa,
  destaque
` as const;

/** Filtros opcionais aplicáveis a qualquer listagem do payload View. */
export interface EstabelecimentosViewFilters {
  apenasDestaque?: boolean;
  apenasComBeneficio?: boolean;
  apenasComTour360?: boolean;
  tipo?: EstabelecimentoFull["tipo"];
  estado?: string;
  limite?: number;
}

/** Lista estabelecimentos ativos no payload unificado de view. */
export async function fetchEstabelecimentosView(
  filters: EstabelecimentosViewFilters = {},
): Promise<EstabelecimentoView[]> {
  let q = supabase
    .from("estabelecimentos")
    .select(ESTAB_VIEW_SELECT)
    .eq("status", "ativo");

  if (filters.apenasDestaque) q = q.eq("destaque", true);
  if (filters.apenasComBeneficio) q = q.eq("tem_beneficio_tea", true);
  if (filters.apenasComTour360) q = q.not("tour_360_url", "is", null);
  if (filters.tipo) q = q.eq("tipo", filters.tipo);
  if (filters.estado) q = q.eq("estado", filters.estado);
  if (filters.limite) q = q.limit(filters.limite);

  const { data, error } = await q.returns<EstabelecimentoView[]>();
  if (error) throw error;
  return data ?? [];
}

/** Busca um estabelecimento ativo por slug (payload completo). */
export async function fetchEstabelecimentoPorSlug(
  slug: string,
): Promise<EstabelecimentoFull | null> {
  const { data, error } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .eq("status", "ativo")
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────────────────────
// Aliases legados (compatibilidade) — preferir os nomes acima.
// ──────────────────────────────────────────────────────────────
/** @deprecated use `EstabelecimentoFull` */
export type Estabelecimento = EstabelecimentoFull;
/** @deprecated use `EstabelecimentoView` */
export type EstabelecimentoCard = EstabelecimentoView;
/** @deprecated use `fetchEstabelecimentosView` */
export const fetchEstabelecimentosCards = fetchEstabelecimentosView;
