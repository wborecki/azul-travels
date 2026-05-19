
ALTER TABLE public.admin_password_resets
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE OR REPLACE FUNCTION public.log_admin_password_reset(
  _target_user_id uuid,
  _motivo text DEFAULT NULL,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _ator_id uuid := auth.uid();
  _ator_email text;
  _target_email text;
  _new_id uuid;
BEGIN
  IF NOT public.has_role(_ator_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem registrar redefinições de senha';
  END IF;

  SELECT email INTO _ator_email FROM auth.users WHERE id = _ator_id;
  SELECT email INTO _target_email FROM auth.users WHERE id = _target_user_id;

  INSERT INTO public.admin_password_resets
    (target_user_id, target_email, ator_id, ator_email, motivo, ip, user_agent)
  VALUES
    (_target_user_id, _target_email, _ator_id, _ator_email, _motivo, _ip, _user_agent)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.log_admin_password_reset(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_admin_password_reset(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_admin_password_reset(uuid, text, text, text) FROM authenticated;
