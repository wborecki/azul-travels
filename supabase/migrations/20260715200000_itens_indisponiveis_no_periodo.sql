-- ============ F5 — Filtro de disponibilidade por datas ============
-- Função set-based que retorna IDs de itens reserváveis completamente
-- indisponíveis em um período [p_checkin, p_checkout).
--
-- Espelha a lógica de `datas_indisponiveis_item` (sobreposição meio-aberta:
-- check-in incluso, check-out exclusivo), mas opera em lote para a busca
-- do /explorar, evitando N+1.
--
-- Um item é indisponível quando:
--   1. existe bloqueio de manutenção cujo intervalo [inicio, fim] sobrepõe
--      o período consultado, OU
--   2. existe pelo menos um dia dentro do período em que o número de
--      reservas ativas (pendente/confirmada) atinge a quantidade total de
--      unidades do item.
--
-- Período inválido (p_checkout <= p_checkin) retorna vazio; a janela é
-- limitada a 12 meses a partir do check-in (mesmo teto de
-- `datas_indisponiveis_item`) para impedir generate_series abusivo via
-- chamada direta anônima.
--
-- SECURITY DEFINER (mesma justificativa de `datas_indisponiveis_item`):
-- precisa ler `reservas` e `item_reservavel_bloqueios`, que têm RLS
-- restritiva. `SET search_path` isola o schema.

CREATE OR REPLACE FUNCTION public.itens_indisponiveis_no_periodo(
  p_checkin date,
  p_checkout date
)
RETURNS TABLE (item_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH periodo AS (
    SELECT
      p_checkin AS checkin,
      LEAST(p_checkout, (p_checkin + INTERVAL '12 months')::date) AS checkout
    WHERE p_checkout > p_checkin
  ),
  dias AS (
    SELECT generate_series(p.checkin, (p.checkout - 1), INTERVAL '1 day')::date AS dia
    FROM periodo p
  ),
  ocupacao AS (
    SELECT
      r.item_reservavel_id,
      d.dia,
      count(*) AS ocupadas
    FROM dias d
    JOIN public.reservas r
      ON r.status IN ('pendente', 'confirmada')
      AND d.dia >= r.data_checkin
      AND d.dia < r.data_checkout
    GROUP BY r.item_reservavel_id, d.dia
  ),
  itens_lotados AS (
    SELECT DISTINCT o.item_reservavel_id
    FROM ocupacao o
    JOIN public.itens_reservaveis ir
      ON ir.id = o.item_reservavel_id AND ir.ativo = true
    WHERE o.ocupadas >= ir.quantidade
  ),
  itens_bloqueados AS (
    SELECT DISTINCT b.item_reservavel_id
    FROM periodo p
    JOIN public.item_reservavel_bloqueios b
      ON p.checkin < (b.fim::date + 1)
      AND p.checkout > b.inicio::date
    WHERE EXISTS (
      SELECT 1 FROM public.itens_reservaveis ir
      WHERE ir.id = b.item_reservavel_id AND ir.ativo = true
    )
  )
  SELECT item_reservavel_id FROM itens_lotados
  UNION
  SELECT item_reservavel_id FROM itens_bloqueados;
$$;

COMMENT ON FUNCTION public.itens_indisponiveis_no_periodo(date, date) IS
  'Retorna IDs de itens reserváveis sem disponibilidade no período. Usado pelo filtro de datas do /explorar.';

REVOKE ALL ON FUNCTION public.itens_indisponiveis_no_periodo(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.itens_indisponiveis_no_periodo(date, date) TO anon, authenticated;
