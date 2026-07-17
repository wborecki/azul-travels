-- ============================================================================
-- Fix: excluir um item reservável falhava com 23503 mesmo sem reservas ativas.
--
-- A regra de produto (migration 20260707130000) é: reservas pendentes ou
-- confirmadas bloqueiam a exclusão (trigger protect_item_reservavel_com_
-- reservas_ativas, com mensagem amigável); reservas históricas (canceladas,
-- recusadas, concluídas) não deveriam impedir. Mas o FK
-- reservas_item_reservavel_id_fkey ficou sem ON DELETE, então qualquer
-- reserva antiga travava o delete com erro cru de FK.
--
-- Solução: ON DELETE SET NULL - a reserva histórica sobrevive sem o link do
-- item (a UI já trata itens_reservaveis nulo em todos os cards). O SET NULL
-- dispara um UPDATE em reservas dentro do DELETE, então os triggers de
-- UPDATE precisam de guardas para esse caso.
-- ============================================================================

ALTER TABLE public.reservas ALTER COLUMN item_reservavel_id DROP NOT NULL;

ALTER TABLE public.reservas
  DROP CONSTRAINT reservas_item_reservavel_id_fkey,
  ADD CONSTRAINT reservas_item_reservavel_id_fkey
    FOREIGN KEY (item_reservavel_id) REFERENCES public.itens_reservaveis(id)
    ON DELETE SET NULL;

-- ============ 1) sincronizar_estabelecimento_id_reserva ============
-- No UPDATE do SET NULL, o SELECT antigo anularia estabelecimento_id (NOT
-- NULL). Reserva histórica mantém o estabelecimento de origem. Reserva nova
-- continua exigindo item (a coluna deixou de ser NOT NULL no banco, a regra
-- passa a ser garantida aqui).

CREATE OR REPLACE FUNCTION public.sincronizar_estabelecimento_id_reserva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.item_reservavel_id IS NULL THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Reserva exige um item reservável'
        USING ERRCODE = 'not_null_violation';
    END IF;
    NEW.estabelecimento_id := OLD.estabelecimento_id;
    RETURN NEW;
  END IF;

  SELECT estabelecimento_id INTO NEW.estabelecimento_id
  FROM public.itens_reservaveis
  WHERE id = NEW.item_reservavel_id;

  RETURN NEW;
END;
$$;

-- ============ 2) checar_disponibilidade_item_reservavel ============
-- Sem item não há o que checar (só acontece no UPDATE do SET NULL, e uma
-- reserva histórica nunca volta a pendente/confirmada sem novo item).

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

-- ============ 3) protect_reservas_estab_owner_columns ============
-- O UPDATE do SET NULL roda com auth.uid() = dono do estabelecimento, e o
-- trigger só permite mudar `status`. Liberar item_reservavel_id → NULL
-- apenas quando o item não existe mais (dentro do DELETE em cascata ele já
-- foi removido); anular o vínculo com o item ainda vivo continua barrado.

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
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.familia_id THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.id = OLD.estabelecimento_id AND e.owner_user_id = auth.uid()
  ) INTO _is_owner;

  IF NOT _is_owner THEN
    RETURN NEW;
  END IF;

  _old := to_jsonb(OLD);
  _new := to_jsonb(NEW);

  FOR _key IN SELECT jsonb_object_keys(_new) LOOP
    IF _key = ANY(_colunas_permitidas) THEN
      CONTINUE;
    END IF;
    IF _key = 'item_reservavel_id'
       AND (_new -> _key) = 'null'::jsonb
       AND NOT EXISTS (
         SELECT 1 FROM public.itens_reservaveis i
         WHERE i.id = (_old ->> 'item_reservavel_id')::uuid
       ) THEN
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
