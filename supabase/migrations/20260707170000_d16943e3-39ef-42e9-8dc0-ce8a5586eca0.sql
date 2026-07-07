-- ============ 1) Capacidade: total vira o campo principal ============
-- Adultos/crianças passam a ser subconjuntos opcionais do total, em vez de
-- campos obrigatórios separados.

ALTER TABLE public.itens_reservaveis ADD COLUMN capacidade_total integer;

UPDATE public.itens_reservaveis
SET capacidade_total = GREATEST(capacidade_adultos + capacidade_criancas, 1);

ALTER TABLE public.itens_reservaveis ALTER COLUMN capacidade_total SET NOT NULL;
ALTER TABLE public.itens_reservaveis ALTER COLUMN capacidade_total SET DEFAULT 2;
ALTER TABLE public.itens_reservaveis
  ADD CONSTRAINT itens_reservaveis_capacidade_total_check CHECK (capacidade_total > 0);

ALTER TABLE public.itens_reservaveis ALTER COLUMN capacidade_adultos DROP NOT NULL;
ALTER TABLE public.itens_reservaveis ALTER COLUMN capacidade_adultos DROP DEFAULT;
ALTER TABLE public.itens_reservaveis ALTER COLUMN capacidade_criancas DROP NOT NULL;
ALTER TABLE public.itens_reservaveis ALTER COLUMN capacidade_criancas DROP DEFAULT;

ALTER TABLE public.itens_reservaveis
  ADD CONSTRAINT itens_reservaveis_capacidade_adultos_limite_check
    CHECK (capacidade_adultos IS NULL OR capacidade_adultos <= capacidade_total),
  ADD CONSTRAINT itens_reservaveis_capacidade_criancas_limite_check
    CHECK (capacidade_criancas IS NULL OR capacidade_criancas <= capacidade_total);

-- ============ 2) Condições do quarto ============

ALTER TABLE public.itens_reservaveis
  ADD COLUMN comodidades text[] NOT NULL DEFAULT '{}',
  ADD COLUMN quantidade_camas integer CHECK (quantidade_camas IS NULL OR quantidade_camas > 0),
  ADD COLUMN check_in_padrao time,
  ADD COLUMN check_out_padrao time;

-- ============ 3) Períodos de indisponibilidade manual ============
-- Ex.: manutenção, reformas ou datas já comprometidas fora da plataforma.
-- Granularidade de dia+hora para exibição, mas o bloqueio de reservas
-- (que só tem granularidade de dia) considera apenas as datas envolvidas.

CREATE TABLE public.item_reservavel_bloqueios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_reservavel_id uuid NOT NULL REFERENCES public.itens_reservaveis(id) ON DELETE CASCADE,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_reservavel_bloqueios_periodo_check CHECK (fim > inicio)
);

CREATE INDEX idx_item_reservavel_bloqueios_item ON public.item_reservavel_bloqueios(item_reservavel_id);

ALTER TABLE public.item_reservavel_bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own item_reservavel_bloqueios" ON public.item_reservavel_bloqueios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.itens_reservaveis i
      JOIN public.estabelecimentos e ON e.id = i.estabelecimento_id
      WHERE i.id = item_reservavel_bloqueios.item_reservavel_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itens_reservaveis i
      JOIN public.estabelecimentos e ON e.id = i.estabelecimento_id
      WHERE i.id = item_reservavel_bloqueios.item_reservavel_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

CREATE POLICY "Admins manage item_reservavel_bloqueios" ON public.item_reservavel_bloqueios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ 4) Disponibilidade também considera bloqueios manuais ============

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
  IF NEW.status NOT IN ('pendente', 'confirmada') THEN
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
    AND r.status IN ('pendente', 'confirmada')
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
