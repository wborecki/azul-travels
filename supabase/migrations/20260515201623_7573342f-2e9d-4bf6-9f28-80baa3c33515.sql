
-- 1. Campos novos em familia_profiles
ALTER TABLE public.familia_profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.familia_profiles
  DROP CONSTRAINT IF EXISTS familia_profiles_status_check;
ALTER TABLE public.familia_profiles
  ADD CONSTRAINT familia_profiles_status_check
  CHECK (status IN ('pendente','ativo','inativo'));

-- 2. Campos novos em estabelecimento_profiles
ALTER TABLE public.estabelecimento_profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text;

ALTER TABLE public.estabelecimento_profiles
  DROP CONSTRAINT IF EXISTS estabelecimento_profiles_status_check;
ALTER TABLE public.estabelecimento_profiles
  ADD CONSTRAINT estabelecimento_profiles_status_check
  CHECK (status IN ('pendente','ativo','inativo'));

-- 3. promoted_by em user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS promoted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Atualiza handle_new_user para gravar origem/status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _account_type text := COALESCE(NEW.raw_user_meta_data->>'account_type', 'familia');
  _origem       text := COALESCE(NEW.raw_user_meta_data->>'origem', NULL);
  _new_estab_id uuid;
  _slug text;
BEGIN
  IF _account_type = 'estabelecimento' THEN
    INSERT INTO public.estabelecimento_profiles
      (id, nome_responsavel, cargo, email, whatsapp, cidade, estado, status, origem)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nome_responsavel',
      NEW.raw_user_meta_data->>'cargo',
      NEW.email,
      NEW.raw_user_meta_data->>'whatsapp',
      NEW.raw_user_meta_data->>'cidade',
      NEW.raw_user_meta_data->>'estado',
      'pendente',
      COALESCE(_origem, 'formulario_parceiro')
    );

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'estabelecimento');

    IF NEW.raw_user_meta_data->>'nome_estabelecimento' IS NOT NULL
       AND NEW.raw_user_meta_data->>'tipo' IS NOT NULL THEN
      _slug := lower(regexp_replace(NEW.raw_user_meta_data->>'nome_estabelecimento','[^a-zA-Z0-9]+','-','g'))
               || '-' || substr(NEW.id::text,1,8);

      INSERT INTO public.estabelecimentos
        (nome, slug, tipo, cidade, estado, owner_user_id, status)
      VALUES (
        NEW.raw_user_meta_data->>'nome_estabelecimento',
        _slug,
        (NEW.raw_user_meta_data->>'tipo')::estab_tipo,
        NEW.raw_user_meta_data->>'cidade',
        NEW.raw_user_meta_data->>'estado',
        NEW.id,
        'pendente'::estab_status
      )
      RETURNING id INTO _new_estab_id;

      UPDATE public.estabelecimento_profiles
        SET estabelecimento_id = _new_estab_id
        WHERE id = NEW.id;
    END IF;
  ELSE
    INSERT INTO public.familia_profiles
      (id, nome_responsavel, email, telefone, cidade, estado, status, origem)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nome_responsavel',
      NEW.email,
      NEW.raw_user_meta_data->>'telefone',
      NEW.raw_user_meta_data->>'cidade',
      NEW.raw_user_meta_data->>'estado',
      'ativo',
      COALESCE(_origem, 'formulario_familia')
    );
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. promote_to_admin (apenas admins)
CREATE OR REPLACE FUNCTION public.promote_to_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem promover outros usuários';
  END IF;

  INSERT INTO public.user_roles (user_id, role, promoted_by)
  VALUES (_user_id, 'admin', auth.uid())
  ON CONFLICT DO NOTHING;
END;
$$;

-- 6. get_dashboard_stats (apenas admins)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem consultar estatísticas';
  END IF;

  SELECT jsonb_build_object(
    'total_familias', (
      SELECT count(DISTINCT ur.user_id) FROM public.user_roles ur WHERE ur.role = 'user'
    ),
    'total_estabelecimentos', (
      SELECT count(DISTINCT ur.user_id) FROM public.user_roles ur WHERE ur.role = 'estabelecimento'
    ),
    'total_admins', (
      SELECT count(DISTINCT ur.user_id) FROM public.user_roles ur WHERE ur.role = 'admin'
    ),
    'novos_esta_semana', (
      SELECT (
        (SELECT count(*) FROM public.familia_profiles WHERE criado_em > now() - interval '7 days') +
        (SELECT count(*) FROM public.estabelecimento_profiles WHERE criado_em > now() - interval '7 days')
      )
    ),
    'familias_com_perfil_tea', (
      SELECT count(DISTINCT fp.id)
      FROM public.familia_profiles fp
      JOIN public.perfil_tea pt ON pt.user_id = fp.id
    ),
    'estabelecimentos_com_perfil', (
      SELECT count(*) FROM public.estabelecimentos
      WHERE owner_user_id IS NOT NULL
        AND descricao IS NOT NULL
        AND length(coalesce(descricao,'')) > 0
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

-- 7. Promove elisabsantin@gmail.com como admin inicial (se já existir)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.email = 'elisabsantin@gmail.com'
ON CONFLICT DO NOTHING;
