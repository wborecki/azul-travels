-- Função que valida transições de status de reservas.
-- Regras (fluxo restrito, vale para admin e família):
--   pendente   -> confirmada | cancelada
--   confirmada -> concluida  | cancelada
--   cancelada  -> (terminal)
--   concluida  -> (terminal)
-- Mesmo status (no-op) é sempre permitido para não atrapalhar updates parciais.

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

DROP TRIGGER IF EXISTS validar_transicao_reserva_status_trg ON public.reservas;

CREATE TRIGGER validar_transicao_reserva_status_trg
BEFORE UPDATE OF status ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.validar_transicao_reserva_status();