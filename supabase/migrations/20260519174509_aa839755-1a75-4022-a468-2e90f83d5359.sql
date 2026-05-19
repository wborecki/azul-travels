
CREATE TABLE public.admin_password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  target_email text,
  ator_id uuid,
  ator_email text,
  motivo text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_password_resets_target ON public.admin_password_resets(target_user_id);
CREATE INDEX idx_admin_password_resets_criado_em ON public.admin_password_resets(criado_em DESC);

ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read password resets"
  ON public.admin_password_resets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert password resets"
  ON public.admin_password_resets
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND ator_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_admin_password_reset(
  _target_user_id uuid,
  _motivo text DEFAULT NULL
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
    (target_user_id, target_email, ator_id, ator_email, motivo)
  VALUES
    (_target_user_id, _target_email, _ator_id, _ator_email, _motivo)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.log_admin_password_reset(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_password_reset(uuid, text) TO authenticated;
