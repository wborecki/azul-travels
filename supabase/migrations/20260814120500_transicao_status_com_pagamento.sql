-- ============ Pagamento, etapa 6/7 — transições de status ============
-- Ver docs/pagamentos/01-fundacao-de-dados.md
--
-- O fluxo passa a ter um estado a mais na frente:
--
--   aguardando_pagamento → pendente → confirmada → concluida
--            ↘                ↘           ↘
--             cancelada        cancelada   cancelada
--
-- Só duas saídas de `aguardando_pagamento`:
--
--   → pendente    o webhook confirmou o pagamento; vira pedido de verdade e
--                 aparece no painel do estabelecimento
--   → cancelada   expirou sem pagar, ou a cobrança foi estornada
--
-- Não existe `pendente → aguardando_pagamento`. Uma reserva paga voltando para
-- "esperando pagamento" seria um caminho sem significado — se o dinheiro voltou
-- (estorno), o destino é `cancelada`, não o começo da fila.
--
-- E `aguardando_pagamento → confirmada` fica de fora de propósito: pular o
-- `pendente` significaria confirmar uma reserva que o estabelecimento nunca
-- viu chegar.
--
-- Corpo idêntico ao de 20260422212155 com o ramo novo; o resto não muda.
-- Manter em sincronia com `RESERVA_TRANSICOES_VALIDAS` em src/lib/enums.ts.

CREATE OR REPLACE FUNCTION public.validar_transicao_reserva_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Sem mudança de status, nada a validar
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Bloqueia limpar o status (NULL)
  IF NEW.status IS NULL THEN
    RAISE EXCEPTION 'Status da reserva não pode ser nulo'
      USING ERRCODE = 'check_violation',
            HINT = 'INVALID_STATUS_TRANSITION';
  END IF;

  -- Estados terminais não podem sair
  IF OLD.status IN ('cancelada', 'concluida') THEN
    RAISE EXCEPTION 'Não é possível alterar uma reserva % (estado final)', OLD.status
      USING ERRCODE = 'check_violation',
            HINT = 'INVALID_STATUS_TRANSITION';
  END IF;

  -- aguardando_pagamento -> pendente | cancelada
  IF OLD.status = 'aguardando_pagamento' AND NEW.status NOT IN ('pendente', 'cancelada') THEN
    RAISE EXCEPTION 'Transição inválida: aguardando_pagamento → %. Permitido: pendente, cancelada', NEW.status
      USING ERRCODE = 'check_violation',
            HINT = 'INVALID_STATUS_TRANSITION';
  END IF;

  -- pendente -> confirmada | cancelada
  IF OLD.status = 'pendente' AND NEW.status NOT IN ('confirmada', 'cancelada') THEN
    RAISE EXCEPTION 'Transição inválida: pendente → %. Permitido: confirmada, cancelada', NEW.status
      USING ERRCODE = 'check_violation',
            HINT = 'INVALID_STATUS_TRANSITION';
  END IF;

  -- confirmada -> concluida | cancelada
  IF OLD.status = 'confirmada' AND NEW.status NOT IN ('concluida', 'cancelada') THEN
    RAISE EXCEPTION 'Transição inválida: confirmada → %. Permitido: concluida, cancelada', NEW.status
      USING ERRCODE = 'check_violation',
            HINT = 'INVALID_STATUS_TRANSITION';
  END IF;

  RETURN NEW;
END;
$$;
