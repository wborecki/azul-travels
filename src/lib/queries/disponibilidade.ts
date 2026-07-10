import { supabase } from "@/integrations/supabase/client";

/**
 * Dias indisponíveis (bloqueio de manutenção ou lotação por reservas ativas)
 * de um item reservável, para o calendário público da página do quarto.
 *
 * Usa a função `datas_indisponiveis_item` (SECURITY DEFINER) - as tabelas
 * `item_reservavel_bloqueios`/`reservas` são privadas, então a vitrine pública
 * só enxerga a lista de datas, nunca os dados da reserva.
 *
 * Retorna um `Set<string>` de datas no formato ISO `YYYY-MM-DD` para lookup
 * O(1) no componente de calendário. Degrada com graça: se a função ainda não
 * existir no banco (migration não aplicada), devolve um set vazio - o
 * calendário mostra tudo como disponível em vez de quebrar a página.
 */
export async function fetchDatasIndisponiveisItem(
  itemId: string,
  ateMesesAdiante = 12,
): Promise<Set<string>> {
  const inicio = new Date();
  const fim = new Date();
  fim.setMonth(fim.getMonth() + ateMesesAdiante);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc("datas_indisponiveis_item", {
    p_item_id: itemId,
    p_inicio: toIso(inicio),
    p_fim: toIso(fim),
  });

  if (error) {
    // Função ausente (migration pendente) ou erro transitório: não derruba a
    // página - assume disponibilidade total e deixa o servidor validar no
    // momento da reserva (trigger `checar_disponibilidade_item_reservavel`).
    return new Set<string>();
  }

  return new Set((data ?? []).map((row) => row.dia));
}
