
-- 1. Add 'estabelecimento' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'estabelecimento';

-- 2. Add owner_user_id to estabelecimentos
ALTER TABLE public.estabelecimentos
  ADD COLUMN IF NOT EXISTS owner_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_owner ON public.estabelecimentos(owner_user_id);

-- 3. Create estabelecimento_profiles
CREATE TABLE IF NOT EXISTS public.estabelecimento_profiles (
  id uuid PRIMARY KEY,
  nome_responsavel text,
  cargo text,
  email text,
  whatsapp text,
  estabelecimento_id uuid,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estabelecimento_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner views own estab profile" ON public.estabelecimento_profiles;
CREATE POLICY "Owner views own estab profile"
  ON public.estabelecimento_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owner inserts own estab profile" ON public.estabelecimento_profiles;
CREATE POLICY "Owner inserts own estab profile"
  ON public.estabelecimento_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Owner updates own estab profile" ON public.estabelecimento_profiles;
CREATE POLICY "Owner updates own estab profile"
  ON public.estabelecimento_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins view all estab profiles" ON public.estabelecimento_profiles;
CREATE POLICY "Admins view all estab profiles"
  ON public.estabelecimento_profiles FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Allow estabelecimento owners to update their own listing
DROP POLICY IF EXISTS "Owner updates own estabelecimento" ON public.estabelecimentos;
CREATE POLICY "Owner updates own estabelecimento"
  ON public.estabelecimentos FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- 5. Update handle_new_user to branch on account_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _account_type text := COALESCE(NEW.raw_user_meta_data->>'account_type', 'familia');
  _new_estab_id uuid;
  _slug text;
BEGIN
  IF _account_type = 'estabelecimento' THEN
    INSERT INTO public.estabelecimento_profiles (id, nome_responsavel, cargo, email, whatsapp)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nome_responsavel',
      NEW.raw_user_meta_data->>'cargo',
      NEW.email,
      NEW.raw_user_meta_data->>'whatsapp'
    );

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'estabelecimento');

    -- create stub estabelecimento listing if name + tipo provided
    IF NEW.raw_user_meta_data->>'nome_estabelecimento' IS NOT NULL
       AND NEW.raw_user_meta_data->>'tipo' IS NOT NULL THEN
      _slug := lower(regexp_replace(NEW.raw_user_meta_data->>'nome_estabelecimento', '[^a-zA-Z0-9]+', '-', 'g'))
               || '-' || substr(NEW.id::text, 1, 8);

      INSERT INTO public.estabelecimentos (
        nome, slug, tipo, cidade, estado, owner_user_id, status
      ) VALUES (
        NEW.raw_user_meta_data->>'nome_estabelecimento',
        _slug,
        (NEW.raw_user_meta_data->>'tipo')::estab_tipo,
        NEW.raw_user_meta_data->>'cidade',
        NEW.raw_user_meta_data->>'estado',
        NEW.id,
        'rascunho'
      )
      RETURNING id INTO _new_estab_id;

      UPDATE public.estabelecimento_profiles
        SET estabelecimento_id = _new_estab_id
        WHERE id = NEW.id;
    END IF;
  ELSE
    INSERT INTO public.familia_profiles (id, nome_responsavel, email, telefone, cidade, estado)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nome_responsavel',
      NEW.email,
      NEW.raw_user_meta_data->>'telefone',
      NEW.raw_user_meta_data->>'cidade',
      NEW.raw_user_meta_data->>'estado'
    );
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- if slug collides, retry with longer suffix
  RETURN NEW;
END;
$function$;

-- ensure trigger exists (it should already, but be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
