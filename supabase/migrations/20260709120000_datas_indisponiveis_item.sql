-- Disponibilidade pública de um item reservável (quarto) para a página
-- `/quartos/$id`. As tabelas `item_reservavel_bloqueios` e `reservas` são
-- privadas (RLS de dono/família), então a vitrine pública não consegue lê-las
-- diretamente. Esta função SECURITY DEFINER expõe apenas o que é seguro: a
-- lista de DIAS indisponíveis no período consultado - sem revelar quem
-- reservou nem qualquer dado da reserva.
--
-- Um dia é indisponível quando:
--   1. cai dentro de um bloqueio de manutenção do item, OU
--   2. o número de reservas ativas (pendente/confirmada) que ocupam aquele
--      dia atinge a `quantidade` de unidades do item.
--
-- A lógica de sobreposição espelha `checar_disponibilidade_item_reservavel()`:
-- reservas usam intervalo meio-aberto [check-in, check-out) (o dia do
-- check-out fica livre) e bloqueios cobrem [inicio::date, fim::date] inclusivo.

CREATE OR REPLACE FUNCTION public.datas_indisponiveis_item(
  p_item_id uuid,
  p_inicio date DEFAULT CURRENT_DATE,
  p_fim date DEFAULT (CURRENT_DATE + INTERVAL '12 months')::date
)
RETURNS TABLE (dia date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH item AS (
    SELECT id, quantidade
    FROM public.itens_reservaveis
    WHERE id = p_item_id AND ativo = true
  ),
  dias AS (
    SELECT generate_series(p_inicio, LEAST(p_fim, (p_inicio + INTERVAL '12 months')::date), INTERVAL '1 day')::date AS dia
  )
  SELECT d.dia
  FROM dias d
  CROSS JOIN item i
  WHERE
    EXISTS (
      SELECT 1 FROM public.item_reservavel_bloqueios b
      WHERE b.item_reservavel_id = i.id
        AND d.dia >= b.inicio::date
        AND d.dia < (b.fim::date + 1)
    )
    OR (
      SELECT count(*)
      FROM public.reservas r
      WHERE r.item_reservavel_id = i.id
        AND r.status IN ('pendente', 'confirmada')
        AND r.data_checkin IS NOT NULL
        AND r.data_checkout IS NOT NULL
        AND d.dia >= r.data_checkin
        AND d.dia < r.data_checkout
    ) >= i.quantidade;
$$;

REVOKE ALL ON FUNCTION public.datas_indisponiveis_item(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.datas_indisponiveis_item(uuid, date, date) TO anon, authenticated;
