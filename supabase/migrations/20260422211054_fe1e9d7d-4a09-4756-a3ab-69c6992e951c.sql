-- 1) Tabela de auditoria de estabelecimentos
CREATE TABLE IF NOT EXISTS public.estabelecimentos_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL,
  estabelecimento_nome text,
  acao text NOT NULL CHECK (acao IN ('criado', 'editado', 'excluido')),
  ator_id uuid,
  ator_email text,
  campo text,
  valor_anterior jsonb,
  valor_novo jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estab_aud_estab ON public.estabelecimentos_auditoria (estabelecimento_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_estab_aud_criado_em ON public.estabelecimentos_auditoria (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_estab_aud_ator ON public.estabelecimentos_auditoria (ator_id);

ALTER TABLE public.estabelecimentos_auditoria ENABLE ROW LEVEL SECURITY;

-- Apenas admins veem o histórico
CREATE POLICY "Admins read estabelecimentos auditoria"
ON public.estabelecimentos_auditoria
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Inserts vêm do trigger (SECURITY DEFINER); permitimos inserts apenas por admins por segurança (defesa em profundidade)
CREATE POLICY "Admins insert estabelecimentos auditoria"
ON public.estabelecimentos_auditoria
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Função de trigger que calcula o diff campo a campo
CREATE OR REPLACE FUNCTION public.log_estabelecimento_auditoria()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ator_id uuid;
  _ator_email text;
  _key text;
  _old jsonb;
  _new jsonb;
  _v_old jsonb;
  _v_new jsonb;
  _campos_ignorar text[] := ARRAY['atualizado_em', 'criado_em'];
BEGIN
  _ator_id := auth.uid();
  IF _ator_id IS NOT NULL THEN
    SELECT email INTO _ator_email FROM auth.users WHERE id = _ator_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.estabelecimentos_auditoria
      (estabelecimento_id, estabelecimento_nome, acao, ator_id, ator_email, campo, valor_anterior, valor_novo)
    VALUES
      (NEW.id, NEW.nome, 'criado', _ator_id, _ator_email, NULL, NULL, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.estabelecimentos_auditoria
      (estabelecimento_id, estabelecimento_nome, acao, ator_id, ator_email, campo, valor_anterior, valor_novo)
    VALUES
      (OLD.id, OLD.nome, 'excluido', _ator_id, _ator_email, NULL, to_jsonb(OLD), NULL);
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);

    -- Itera as chaves do NEW e compara com OLD; insere uma linha por campo alterado
    FOR _key IN SELECT jsonb_object_keys(_new) LOOP
      IF _key = ANY(_campos_ignorar) THEN
        CONTINUE;
      END IF;
      _v_old := _old -> _key;
      _v_new := _new -> _key;
      IF _v_old IS DISTINCT FROM _v_new THEN
        INSERT INTO public.estabelecimentos_auditoria
          (estabelecimento_id, estabelecimento_nome, acao, ator_id, ator_email, campo, valor_anterior, valor_novo)
        VALUES
          (NEW.id, NEW.nome, 'editado', _ator_id, _ator_email, _key, _v_old, _v_new);
      END IF;
    END LOOP;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- 3) Trigger
DROP TRIGGER IF EXISTS trg_log_estabelecimento_auditoria ON public.estabelecimentos;
CREATE TRIGGER trg_log_estabelecimento_auditoria
AFTER INSERT OR UPDATE OR DELETE ON public.estabelecimentos
FOR EACH ROW EXECUTE FUNCTION public.log_estabelecimento_auditoria();