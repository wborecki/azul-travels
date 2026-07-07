-- ============ 1) Capacidade: total vira o campo principal ============
-- Adultos/crianças passam a ser subconjuntos opcionais do total, em vez de
-- campos obrigatórios separados.

ALTER TABLE public.opcoes_reserva ADD COLUMN capacidade_total integer;

UPDATE public.opcoes_reserva
SET capacidade_total = GREATEST(capacidade_adultos + capacidade_criancas, 1);

ALTER TABLE public.opcoes_reserva ALTER COLUMN capacidade_total SET NOT NULL;
ALTER TABLE public.opcoes_reserva ALTER COLUMN capacidade_total SET DEFAULT 2;
ALTER TABLE public.opcoes_reserva
  ADD CONSTRAINT opcoes_reserva_capacidade_total_check CHECK (capacidade_total > 0);

ALTER TABLE public.opcoes_reserva ALTER COLUMN capacidade_adultos DROP NOT NULL;
ALTER TABLE public.opcoes_reserva ALTER COLUMN capacidade_adultos DROP DEFAULT;
ALTER TABLE public.opcoes_reserva ALTER COLUMN capacidade_criancas DROP NOT NULL;
ALTER TABLE public.opcoes_reserva ALTER COLUMN capacidade_criancas DROP DEFAULT;

ALTER TABLE public.opcoes_reserva
  ADD CONSTRAINT opcoes_reserva_capacidade_adultos_limite_check
    CHECK (capacidade_adultos IS NULL OR capacidade_adultos <= capacidade_total),
  ADD CONSTRAINT opcoes_reserva_capacidade_criancas_limite_check
    CHECK (capacidade_criancas IS NULL OR capacidade_criancas <= capacidade_total);

-- ============ 2) Condições do quarto ============

ALTER TABLE public.opcoes_reserva
  ADD COLUMN comodidades text[] NOT NULL DEFAULT '{}',
  ADD COLUMN quantidade_camas integer CHECK (quantidade_camas IS NULL OR quantidade_camas > 0),
  ADD COLUMN check_in_padrao time,
  ADD COLUMN check_out_padrao time;

-- ============ 3) Períodos de indisponibilidade manual ============
-- Ex.: manutenção, reformas ou datas já comprometidas fora da plataforma.
-- Granularidade de dia+hora para exibição, mas o bloqueio de reservas
-- (que só tem granularidade de dia) considera apenas as datas envolvidas.

CREATE TABLE public.opcao_bloqueios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opcao_reserva_id uuid NOT NULL REFERENCES public.opcoes_reserva(id) ON DELETE CASCADE,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opcao_bloqueios_periodo_check CHECK (fim > inicio)
);

CREATE INDEX idx_opcao_bloqueios_opcao ON public.opcao_bloqueios(opcao_reserva_id);

ALTER TABLE public.opcao_bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own opcao_bloqueios" ON public.opcao_bloqueios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opcoes_reserva o
      JOIN public.estabelecimentos e ON e.id = o.estabelecimento_id
      WHERE o.id = opcao_bloqueios.opcao_reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opcoes_reserva o
      JOIN public.estabelecimentos e ON e.id = o.estabelecimento_id
      WHERE o.id = opcao_bloqueios.opcao_reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

CREATE POLICY "Admins manage opcao_bloqueios" ON public.opcao_bloqueios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ 4) Disponibilidade também considera bloqueios manuais ============

CREATE OR REPLACE FUNCTION public.checar_disponibilidade_opcao_reserva()
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
  IF NEW.status NOT IN ('pendente', 'confirmada') THEN
    RETURN NEW;
  END IF;

  IF NEW.data_checkin IS NULL OR NEW.data_checkout IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.opcao_bloqueios b
    WHERE b.opcao_reserva_id = NEW.opcao_reserva_id
      AND NEW.data_checkin < (b.fim::date + 1)
      AND NEW.data_checkout > b.inicio::date
  ) INTO _bloqueada;

  IF _bloqueada THEN
    RAISE EXCEPTION 'Esta opção está bloqueada no período selecionado'
      USING ERRCODE = 'check_violation', HINT = 'OPCAO_SEM_DISPONIBILIDADE';
  END IF;

  SELECT quantidade INTO _quantidade
  FROM public.opcoes_reserva
  WHERE id = NEW.opcao_reserva_id;

  SELECT count(*) INTO _ocupadas
  FROM public.reservas r
  WHERE r.opcao_reserva_id = NEW.opcao_reserva_id
    AND r.id IS DISTINCT FROM NEW.id
    AND r.status IN ('pendente', 'confirmada')
    AND r.data_checkin IS NOT NULL
    AND r.data_checkout IS NOT NULL
    AND r.data_checkin < NEW.data_checkout
    AND r.data_checkout > NEW.data_checkin;

  IF _ocupadas >= _quantidade THEN
    RAISE EXCEPTION 'Não há disponibilidade para esta opção no período selecionado'
      USING ERRCODE = 'check_violation', HINT = 'OPCAO_SEM_DISPONIBILIDADE';
  END IF;

  RETURN NEW;
END;
$$;
