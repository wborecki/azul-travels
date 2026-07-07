-- As migrations de 2026-07-07 (opcoes_reserva/opcao_bloqueios) já tinham sido
-- aplicadas no remoto antes do rename para itens_reservaveis/item_reservavel_bloqueios
-- ter sido feito nos arquivos de migration. `supabase db push` só compara versão,
-- não conteúdo, então reescrever aquelas migrations não teve efeito no remoto.
-- Esta migration renomeia os objetos já existentes para alinhar o remoto ao
-- histórico reescrito.

-- ============ 1) Tabelas ============
ALTER TABLE public.opcoes_reserva RENAME TO itens_reservaveis;
ALTER TABLE public.opcao_bloqueios RENAME TO item_reservavel_bloqueios;

-- ============ 2) Colunas ============
ALTER TABLE public.item_reservavel_bloqueios RENAME COLUMN opcao_reserva_id TO item_reservavel_id;
ALTER TABLE public.reservas RENAME COLUMN opcao_reserva_id TO item_reservavel_id;

-- ============ 3) Constraints (pkey, checks, fkeys) ============
ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_pkey TO itens_reservaveis_pkey;
ALTER TABLE public.item_reservavel_bloqueios RENAME CONSTRAINT opcao_bloqueios_pkey TO item_reservavel_bloqueios_pkey;

ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_capacidade_adultos_check TO itens_reservaveis_capacidade_adultos_check;
ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_capacidade_adultos_limite_check TO itens_reservaveis_capacidade_adultos_limite_check;
ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_capacidade_criancas_check TO itens_reservaveis_capacidade_criancas_check;
ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_capacidade_criancas_limite_check TO itens_reservaveis_capacidade_criancas_limite_check;
ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_capacidade_total_check TO itens_reservaveis_capacidade_total_check;
ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_preco_check TO itens_reservaveis_preco_check;
ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_quantidade_camas_check TO itens_reservaveis_quantidade_camas_check;
ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_quantidade_check TO itens_reservaveis_quantidade_check;

ALTER TABLE public.item_reservavel_bloqueios RENAME CONSTRAINT opcao_bloqueios_periodo_check TO item_reservavel_bloqueios_periodo_check;

ALTER TABLE public.itens_reservaveis RENAME CONSTRAINT opcoes_reserva_estabelecimento_id_fkey TO itens_reservaveis_estabelecimento_id_fkey;
ALTER TABLE public.item_reservavel_bloqueios RENAME CONSTRAINT opcao_bloqueios_opcao_reserva_id_fkey TO item_reservavel_bloqueios_item_reservavel_id_fkey;
ALTER TABLE public.reservas RENAME CONSTRAINT reservas_opcao_reserva_id_fkey TO reservas_item_reservavel_id_fkey;

-- ============ 4) Índices ============
ALTER INDEX public.idx_opcoes_reserva_estabelecimento RENAME TO idx_itens_reservaveis_estabelecimento;
ALTER INDEX public.idx_opcao_bloqueios_opcao RENAME TO idx_item_reservavel_bloqueios_item;
ALTER INDEX public.idx_reservas_opcao_reserva RENAME TO idx_reservas_item_reservavel;

-- ============ 5) Policies ============
-- USING/WITH CHECK são guardados como árvore de expressão (por OID/attnum),
-- não como texto - continuam funcionando após o rename das tabelas/colunas.
-- Só o nome da policy precisa ser atualizado para bater com o histórico novo.
ALTER POLICY "Public reads opcoes ativas de estab certificado" ON public.itens_reservaveis RENAME TO "Public reads itens ativos de estab certificado";
ALTER POLICY "Owner manages own opcoes_reserva" ON public.itens_reservaveis RENAME TO "Owner manages own itens_reservaveis";
ALTER POLICY "Admins manage opcoes_reserva" ON public.itens_reservaveis RENAME TO "Admins manage itens_reservaveis";
ALTER POLICY "Owner manages own opcao_bloqueios" ON public.item_reservavel_bloqueios RENAME TO "Owner manages own item_reservavel_bloqueios";
ALTER POLICY "Admins manage opcao_bloqueios" ON public.item_reservavel_bloqueios RENAME TO "Admins manage item_reservavel_bloqueios";

-- ============ 6) Functions/triggers ============
-- Corpo de função é texto literal reparseado a cada chamada - ao contrário de
-- policies/views, NÃO acompanha o rename de tabela/coluna automaticamente.
-- sincronizar_estabelecimento_id_reserva mantém o nome (só o corpo muda); a
-- trigger que a usa referencia a coluna por attnum, então sobrevive ao rename
-- de `opcao_reserva_id` sem precisar ser recriada.
CREATE OR REPLACE FUNCTION public.sincronizar_estabelecimento_id_reserva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT estabelecimento_id INTO NEW.estabelecimento_id
  FROM public.itens_reservaveis
  WHERE id = NEW.item_reservavel_id;

  RETURN NEW;
END;
$$;

-- checar_disponibilidade_opcao_reserva / protect_opcao_reserva_com_reservas_ativas
-- trocam de nome: cria a função nova, migra a trigger para ela e só então
-- derruba a função antiga (senão o DROP falha por causa da trigger antiga).
CREATE FUNCTION public.checar_disponibilidade_item_reservavel()
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

DROP TRIGGER IF EXISTS trg_checar_disponibilidade_opcao_reserva ON public.reservas;
CREATE TRIGGER trg_checar_disponibilidade_item_reservavel
  BEFORE INSERT OR UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.checar_disponibilidade_item_reservavel();

DROP FUNCTION public.checar_disponibilidade_opcao_reserva();

REVOKE EXECUTE ON FUNCTION public.checar_disponibilidade_item_reservavel() FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.protect_item_reservavel_com_reservas_ativas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.item_reservavel_id = OLD.id AND r.status IN ('pendente', 'confirmada')
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir um item com reservas em andamento - pause em vez de excluir'
      USING ERRCODE = 'check_violation', HINT = 'ITEM_COM_RESERVAS_ATIVAS';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_opcao_reserva_com_reservas_ativas ON public.itens_reservaveis;
CREATE TRIGGER trg_protect_item_reservavel_com_reservas_ativas
  BEFORE DELETE ON public.itens_reservaveis
  FOR EACH ROW EXECUTE FUNCTION public.protect_item_reservavel_com_reservas_ativas();

DROP FUNCTION public.protect_opcao_reserva_com_reservas_ativas();

REVOKE EXECUTE ON FUNCTION public.protect_item_reservavel_com_reservas_ativas() FROM PUBLIC, anon, authenticated;

-- ============ 7) Storage bucket ============
-- bucket_id nas policies de storage.objects é comparação de string literal,
-- não referência de catálogo - não acompanha rename, precisa recriar.
INSERT INTO storage.buckets (id, name, public)
VALUES ('itens-reservaveis-fotos', 'itens-reservaveis-fotos', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.objects SET bucket_id = 'itens-reservaveis-fotos' WHERE bucket_id = 'opcoes-reserva-fotos';

-- storage.buckets tem uma trigger que bloqueia DELETE direto (só via Storage
-- API por padrão); este é o escape hatch oficial, vale só para esta transação.
SET LOCAL storage.allow_delete_query = 'true';
DELETE FROM storage.buckets WHERE id = 'opcoes-reserva-fotos';

DROP POLICY IF EXISTS "Public reads opcoes-reserva-fotos" ON storage.objects;
DROP POLICY IF EXISTS "Owners upload opcoes-reserva-fotos" ON storage.objects;
DROP POLICY IF EXISTS "Owners update opcoes-reserva-fotos" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete opcoes-reserva-fotos" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage opcoes-reserva-fotos" ON storage.objects;

CREATE POLICY "Public reads itens-reservaveis-fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'itens-reservaveis-fotos');

CREATE POLICY "Owners upload itens-reservaveis-fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Owners update itens-reservaveis-fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Owners delete itens-reservaveis-fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Admins manage itens-reservaveis-fotos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'itens-reservaveis-fotos' AND public.has_role(auth.uid(), 'admin'));
