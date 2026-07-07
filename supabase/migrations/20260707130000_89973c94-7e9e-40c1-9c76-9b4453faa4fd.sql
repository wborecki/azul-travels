CREATE TABLE public.opcoes_reserva (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  preco numeric(10,2),
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  imagens jsonb NOT NULL DEFAULT '[]',
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_opcoes_reserva_estabelecimento ON public.opcoes_reserva(estabelecimento_id);

ALTER TABLE public.opcoes_reserva ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads opcoes ativas de estab certificado" ON public.opcoes_reserva
  FOR SELECT TO anon, authenticated
  USING (
    ativo = true
    AND EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = opcoes_reserva.estabelecimento_id
        AND e.status = 'ativo'
        AND e.selo_azul = true
    )
  );

CREATE POLICY "Owner manages own opcoes_reserva" ON public.opcoes_reserva
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = opcoes_reserva.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = opcoes_reserva.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

CREATE POLICY "Admins manage opcoes_reserva" ON public.opcoes_reserva
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ 1) Reserva passa a exigir uma opção ============
-- Sem dado de produção a preservar - reservas de teste são resetadas.
-- `reserva_mensagens`/`reservas_auditoria` têm FK ON DELETE CASCADE para
-- `reservas`, então são limpas junto.

DELETE FROM public.reservas;

ALTER TABLE public.reservas
  ADD COLUMN opcao_reserva_id uuid REFERENCES public.opcoes_reserva(id);

ALTER TABLE public.reservas
  ALTER COLUMN opcao_reserva_id SET NOT NULL;

CREATE INDEX idx_reservas_opcao_reserva ON public.reservas(opcao_reserva_id);

-- ============ 2) estabelecimento_id sempre derivado da opção ============
-- `reservas.estabelecimento_id` continua existindo (denormalizado - todo o
-- resto do código já filtra por ele), mas nunca mais confia no valor do
-- client: é recalculado a partir da opção escolhida, mesmo padrão de
-- "trigger recalcula fatos do banco" já usado em autor_role/ator_role.

CREATE OR REPLACE FUNCTION public.sincronizar_estabelecimento_id_reserva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT estabelecimento_id INTO NEW.estabelecimento_id
  FROM public.opcoes_reserva
  WHERE id = NEW.opcao_reserva_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sincronizar_estabelecimento_id_reserva ON public.reservas;
CREATE TRIGGER trg_sincronizar_estabelecimento_id_reserva
  BEFORE INSERT OR UPDATE OF opcao_reserva_id ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.sincronizar_estabelecimento_id_reserva();

REVOKE EXECUTE ON FUNCTION public.sincronizar_estabelecimento_id_reserva() FROM PUBLIC, anon, authenticated;

-- ============ 3) Disponibilidade: bloqueio automático por quantidade ============
-- Conta reservas pendente/confirmada da mesma opção cujo período se
-- sobrepõe ao solicitado; bloqueia se atingir a quantidade cadastrada.
-- SECURITY DEFINER é necessário porque a contagem precisa enxergar
-- reservas de outras famílias (RLS normalmente restringe cada família à
-- própria reserva) para o bloqueio valer entre famílias diferentes.

CREATE OR REPLACE FUNCTION public.checar_disponibilidade_opcao_reserva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _quantidade integer;
  _ocupadas integer;
BEGIN
  IF NEW.status NOT IN ('pendente', 'confirmada') THEN
    RETURN NEW;
  END IF;

  IF NEW.data_checkin IS NULL OR NEW.data_checkout IS NULL THEN
    RETURN NEW;
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

DROP TRIGGER IF EXISTS trg_checar_disponibilidade_opcao_reserva ON public.reservas;
CREATE TRIGGER trg_checar_disponibilidade_opcao_reserva
  BEFORE INSERT OR UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.checar_disponibilidade_opcao_reserva();

REVOKE EXECUTE ON FUNCTION public.checar_disponibilidade_opcao_reserva() FROM PUBLIC, anon, authenticated;

-- ============ 4) Opção com reserva ativa não pode ser excluída ============
-- Só pausar (`ativo = false`) é permitido nesse caso; exclusão de verdade
-- só é possível sem nenhuma reserva pendente/confirmada vinculada.

CREATE OR REPLACE FUNCTION public.protect_opcao_reserva_com_reservas_ativas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.opcao_reserva_id = OLD.id AND r.status IN ('pendente', 'confirmada')
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir uma opção com reservas em andamento - pause em vez de excluir'
      USING ERRCODE = 'check_violation', HINT = 'OPCAO_COM_RESERVAS_ATIVAS';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_opcao_reserva_com_reservas_ativas ON public.opcoes_reserva;
CREATE TRIGGER trg_protect_opcao_reserva_com_reservas_ativas
  BEFORE DELETE ON public.opcoes_reserva
  FOR EACH ROW EXECUTE FUNCTION public.protect_opcao_reserva_com_reservas_ativas();

REVOKE EXECUTE ON FUNCTION public.protect_opcao_reserva_com_reservas_ativas() FROM PUBLIC, anon, authenticated;
