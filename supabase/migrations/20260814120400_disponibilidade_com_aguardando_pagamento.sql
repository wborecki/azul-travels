-- ============ Pagamento, etapa 5/7 — disponibilidade conta o pagamento em aberto ============
-- Ver docs/pagamentos/01-fundacao-de-dados.md, US-1.2
--
-- Uma reserva em `aguardando_pagamento` é uma reserva viva: o quarto está
-- segurado enquanto a família está na tela de pagamento. Se a disponibilidade
-- não a enxergar, duas famílias pagam pelo mesmo quarto na mesma data — e uma
-- delas descobre isso depois de ter pago.
--
-- A lista `('pendente', 'confirmada')` estava replicada em quatro lugares.
-- Este arquivo troca os quatro de uma vez; é a razão de eles estarem juntos
-- aqui em vez de espalhados pelas migrations temáticas.
--
--   itens_indisponiveis_no_periodo         20260715200000, linha 52
--   datas_indisponiveis_item               20260709120000, linha 50
--   checar_disponibilidade_item_reservavel 20260715220000, linha 102
--   protect_item_reservavel_com_reservas_ativas  20260707130000, linha 165
--
-- O índice `idx_reservas_visita_unica_por_dia` (20260804120000, linha 119)
-- **não** entra: o predicado dele é `hora_visita IS NOT NULL`, e visita não é
-- cobrada, logo nunca chega a `aguardando_pagamento`.

-- ============================================================================
-- 1) Busca do /explorar — filtro de datas em lote
-- ============================================================================
-- Corpo idêntico ao de 20260715200000; muda só a lista de status ocupantes.

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
      ON r.status IN ('aguardando_pagamento', 'pendente', 'confirmada')
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

-- ============================================================================
-- 2) Calendário público de um quarto
-- ============================================================================
-- Corpo idêntico ao de 20260709120000; muda só a lista de status ocupantes.
--
-- Um efeito colateral desejado: enquanto uma família está pagando, o
-- calendário de /quartos/$id já mostra o dia como indisponível para as
-- outras. É a mesma informação que o filtro de busca dá, e as duas telas
-- precisam concordar.

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
        AND r.status IN ('aguardando_pagamento', 'pendente', 'confirmada')
        AND r.data_checkin IS NOT NULL
        AND r.data_checkout IS NOT NULL
        AND d.dia >= r.data_checkin
        AND d.dia < r.data_checkout
    ) >= i.quantidade;
$$;

-- ============================================================================
-- 3) A trava de escrita — trigger de disponibilidade
-- ============================================================================
-- Corpo idêntico ao de 20260715220000; mudam as duas listas de status.
--
-- São dois papéis diferentes no mesmo `IN`:
--
--   o primeiro decide se a reserva ENTRANDO precisa ser checada — uma estadia
--   nascendo em `aguardando_pagamento` precisa, senão a reserva não paga não
--   competiria por unidade nenhuma;
--
--   o segundo decide quais reservas já existentes CONTAM como ocupação.
--
-- Sem o primeiro, a checagem seria pulada exatamente no momento em que ela
-- importa. Sem o segundo, duas reservas aguardando pagamento passariam juntas.
-- Esta função é o que de fato impede o quarto de ser vendido duas vezes: as
-- funções acima só informam a UI.

CREATE OR REPLACE FUNCTION public.checar_disponibilidade_item_reservavel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _quantidade integer;
  _ocupadas integer;
  _bloqueada boolean;
BEGIN
  IF NEW.item_reservavel_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('aguardando_pagamento', 'pendente', 'confirmada') THEN
    RETURN NEW;
  END IF;

  IF NEW.data_checkin IS NULL OR NEW.data_checkout IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.item_reservavel_bloqueios b
    WHERE b.item_reservavel_id = NEW.item_reservavel_id
      AND NEW.data_checkin < (b.fim::date + 1)
      AND NEW.data_checkout > b.inicio::date
  ) INTO _bloqueada;

  IF _bloqueada THEN
    RAISE EXCEPTION 'Este item está bloqueado no período selecionado'
      USING ERRCODE = 'check_violation', HINT = 'ITEM_SEM_DISPONIBILIDADE';
  END IF;

  SELECT quantidade INTO _quantidade
  FROM public.itens_reservaveis
  WHERE id = NEW.item_reservavel_id;

  SELECT count(*) INTO _ocupadas
  FROM public.reservas r
  WHERE r.item_reservavel_id = NEW.item_reservavel_id
    AND r.id IS DISTINCT FROM NEW.id
    AND r.status IN ('aguardando_pagamento', 'pendente', 'confirmada')
    AND r.data_checkin IS NOT NULL
    AND r.data_checkout IS NOT NULL
    AND r.data_checkin < NEW.data_checkout
    AND r.data_checkout > NEW.data_checkin;

  IF _ocupadas >= _quantidade THEN
    RAISE EXCEPTION 'Não há disponibilidade para este item no período selecionado'
      USING ERRCODE = 'check_violation', HINT = 'ITEM_SEM_DISPONIBILIDADE';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4) Exclusão de quarto com reserva viva
-- ============================================================================
-- Corpo idêntico ao de 20260707130000; muda só a lista de status.
--
-- Uma família com pagamento em aberto para este quarto é o caso mais delicado
-- de todos: o dinheiro pode entrar depois do quarto já ter sido apagado. A
-- mensagem continua a mesma, porque a saída também é a mesma — pausar o item
-- em vez de excluir.

CREATE OR REPLACE FUNCTION public.protect_item_reservavel_com_reservas_ativas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.item_reservavel_id = OLD.id
      AND r.status IN ('aguardando_pagamento', 'pendente', 'confirmada')
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir um item com reservas em andamento - pause em vez de excluir'
      USING ERRCODE = 'check_violation', HINT = 'ITEM_COM_RESERVAS_ATIVAS';
  END IF;

  RETURN OLD;
END;
$$;
