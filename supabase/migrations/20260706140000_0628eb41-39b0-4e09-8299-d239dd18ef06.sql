
-- ============ 1) RLS: dono lê e atualiza status das reservas do seu local ============

CREATE POLICY "Owner reads reservas of own estab" ON public.reservas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = reservas.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

CREATE POLICY "Owner updates status of own estab reservas" ON public.reservas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = reservas.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = reservas.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

CREATE INDEX IF NOT EXISTS idx_reservas_estabelecimento_id ON public.reservas(estabelecimento_id);

-- ============ 2) Trigger: dono só pode alterar `status` ============
-- A policy de UPDATE acima libera a linha inteira; sem isto o dono
-- poderia reescrever datas, mensagem, perfil vinculado etc. via API REST.

CREATE OR REPLACE FUNCTION public.protect_reservas_estab_owner_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_owner boolean;
  _key text;
  _old jsonb;
  _new jsonb;
  _colunas_permitidas text[] := ARRAY['status'];
BEGIN
  -- auth.uid() nulo = service role / admin → liberado (mesmo padrão de
  -- protect_estabelecimentos_admin_columns).
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- família dona da reserva: comportamento pré-existente, sem restrição extra.
  IF auth.uid() = OLD.familia_id THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.id = OLD.estabelecimento_id AND e.owner_user_id = auth.uid()
  ) INTO _is_owner;

  -- nem família nem admin nem dono: a policy de UPDATE já deveria ter
  -- barrado antes de chegar aqui; nada a fazer.
  IF NOT _is_owner THEN
    RETURN NEW;
  END IF;

  _old := to_jsonb(OLD);
  _new := to_jsonb(NEW);

  FOR _key IN SELECT jsonb_object_keys(_new) LOOP
    IF _key = ANY(_colunas_permitidas) THEN
      CONTINUE;
    END IF;
    IF (_old -> _key) IS DISTINCT FROM (_new -> _key) THEN
      RAISE EXCEPTION 'Estabelecimento só pode alterar o status da reserva'
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_reservas_estab_owner_columns ON public.reservas;
CREATE TRIGGER trg_protect_reservas_estab_owner_columns
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.protect_reservas_estab_owner_columns();

REVOKE EXECUTE ON FUNCTION public.protect_reservas_estab_owner_columns() FROM PUBLIC, anon, authenticated;

-- ============ 3) LGPD: perfil só visível ao dono com consentimento ============
-- `reservas.perfil_enviado_ao_estabelecimento` é o consentimento da família
-- para compartilhar o perfil sensorial/TEA com o local da reserva.

CREATE POLICY "Owner reads perfil_tea when reserva consentida" ON public.perfil_tea
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.perfil_tea_id = perfil_tea.id
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

CREATE POLICY "Owner reads perfil_sensorial when reserva consentida" ON public.perfil_sensorial
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.perfil_sensorial_id = perfil_sensorial.id
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

CREATE POLICY "Owner reads familia_profiles when reserva consentida" ON public.familia_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.familia_id = familia_profiles.id
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

-- ============ 4) Auditoria: registrar o papel de quem mudou a reserva ============

ALTER TABLE public.reservas_auditoria
  ADD COLUMN IF NOT EXISTS ator_role public.app_role;

-- Calcula `ator_role` a partir de fatos do banco (nunca do valor enviado
-- pelo client) - mesma lógica de "não confiar no client" das outras
-- trigger de proteção desta migration.
CREATE OR REPLACE FUNCTION public.set_reservas_auditoria_ator_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(NEW.ator_id, 'admin') THEN
    NEW.ator_role := 'admin';
  ELSIF EXISTS (
    SELECT 1
    FROM public.reservas r
    JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
    WHERE r.id = NEW.reserva_id AND e.owner_user_id = NEW.ator_id
  ) THEN
    NEW.ator_role := 'estabelecimento';
  ELSIF EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.id = NEW.reserva_id AND r.familia_id = NEW.ator_id
  ) THEN
    NEW.ator_role := 'user';
  ELSE
    NEW.ator_role := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_reservas_auditoria_ator_role ON public.reservas_auditoria;
CREATE TRIGGER trg_set_reservas_auditoria_ator_role
  BEFORE INSERT ON public.reservas_auditoria
  FOR EACH ROW EXECUTE FUNCTION public.set_reservas_auditoria_ator_role();

REVOKE EXECUTE ON FUNCTION public.set_reservas_auditoria_ator_role() FROM PUBLIC, anon, authenticated;

-- Dono passa a poder logar auditoria das próprias ações (Fase 2 vai
-- usar isto ao confirmar/recusar/concluir reservas). `ator_role` é
-- recalculado pela trigger acima, então não pode ser forjado aqui.
CREATE POLICY "Owner inserts auditoria for own estab reservas" ON public.reservas_auditoria
  FOR INSERT TO authenticated
  WITH CHECK (
    ator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reservas_auditoria.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );
