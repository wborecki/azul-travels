

CREATE TABLE public.reserva_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL,
  autor_role public.app_role,
  corpo text NOT NULL CHECK (btrim(corpo) <> ''),
  lida_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reserva_mensagens_reserva ON public.reserva_mensagens(reserva_id, criado_em);

ALTER TABLE public.reserva_mensagens ENABLE ROW LEVEL SECURITY;

-- ============ 1) autor_role calculado por trigger (nunca confia no client) ============

CREATE OR REPLACE FUNCTION public.set_reserva_mensagem_autor_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(NEW.autor_id, 'admin') THEN
    NEW.autor_role := 'admin';
  ELSIF EXISTS (
    SELECT 1
    FROM public.reservas r
    JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
    WHERE r.id = NEW.reserva_id AND e.owner_user_id = NEW.autor_id
  ) THEN
    NEW.autor_role := 'estabelecimento';
  ELSIF EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.id = NEW.reserva_id AND r.familia_id = NEW.autor_id
  ) THEN
    NEW.autor_role := 'user';
  ELSE
    NEW.autor_role := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_reserva_mensagem_autor_role ON public.reserva_mensagens;
CREATE TRIGGER trg_set_reserva_mensagem_autor_role
  BEFORE INSERT ON public.reserva_mensagens
  FOR EACH ROW EXECUTE FUNCTION public.set_reserva_mensagem_autor_role();

REVOKE EXECUTE ON FUNCTION public.set_reserva_mensagem_autor_role() FROM PUBLIC, anon, authenticated;

-- ============ 2) trava de colunas: UPDATE só pode alterar `lida_em` ============
-- Mensagem é imutável (histórico de conversa) - a única mutação permitida
-- é marcar como lida.

CREATE OR REPLACE FUNCTION public.protect_reserva_mensagens_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _key text;
  _old jsonb;
  _new jsonb;
  _colunas_permitidas text[] := ARRAY['lida_em'];
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  _old := to_jsonb(OLD);
  _new := to_jsonb(NEW);

  FOR _key IN SELECT jsonb_object_keys(_new) LOOP
    IF _key = ANY(_colunas_permitidas) THEN
      CONTINUE;
    END IF;
    IF (_old -> _key) IS DISTINCT FROM (_new -> _key) THEN
      RAISE EXCEPTION 'Só é permitido marcar a mensagem como lida'
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_reserva_mensagens_columns ON public.reserva_mensagens;
CREATE TRIGGER trg_protect_reserva_mensagens_columns
  BEFORE UPDATE ON public.reserva_mensagens
  FOR EACH ROW EXECUTE FUNCTION public.protect_reserva_mensagens_columns();

REVOKE EXECUTE ON FUNCTION public.protect_reserva_mensagens_columns() FROM PUBLIC, anon, authenticated;

-- ============ 3) RLS: participante da reserva ============
-- Participante = família dona (`reservas.familia_id`) OU dono do
-- estabelecimento do local, respeitando o mesmo gate de Selo Azul
-- ativo da Fase 0. Admin só lê (suporte/moderação) - não é participante
-- da conversa.

CREATE POLICY "Participants read reserva_mensagens" ON public.reserva_mensagens
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_mensagens.reserva_id AND r.familia_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reserva_mensagens.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Participants send reserva_mensagens" ON public.reserva_mensagens
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.reservas r
        WHERE r.id = reserva_mensagens.reserva_id AND r.familia_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.reservas r
        JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
        WHERE r.id = reserva_mensagens.reserva_id
          AND e.owner_user_id = auth.uid()
          AND e.selo_azul = true
          AND e.status = 'ativo'
      )
    )
  );

CREATE POLICY "Participants mark reserva_mensagens as read" ON public.reserva_mensagens
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_mensagens.reserva_id AND r.familia_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reserva_mensagens.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_mensagens.reserva_id AND r.familia_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reserva_mensagens.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );
