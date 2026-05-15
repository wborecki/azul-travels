
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
        'pendente'::estab_status
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
END;
$function$;
