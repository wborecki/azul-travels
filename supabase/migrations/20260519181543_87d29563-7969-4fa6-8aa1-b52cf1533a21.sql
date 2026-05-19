-- 1. Tabela
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  sucesso boolean NOT NULL DEFAULT true,
  user_id uuid,
  email_mascarado text,
  ip text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_audit_evento_check CHECK (
    evento IN (
      'login_success','login_failure',
      'logout',
      'signup_success','signup_failure',
      'password_reset_request','password_reset_complete',
      'admin_password_reset',
      'session_refresh','session_expired',
      'oauth_start','oauth_callback'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_criado_em ON public.auth_audit_log (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id  ON public.auth_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_evento   ON public.auth_audit_log (evento);

-- 2. RLS
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read auth audit" ON public.auth_audit_log;
CREATE POLICY "Admins read auth audit"
  ON public.auth_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Nenhuma policy de INSERT/UPDATE/DELETE: tudo passa pela função SECURITY DEFINER.

-- 3. Função utilitária de mascaramento (interna)
CREATE OR REPLACE FUNCTION public._mascarar_email(_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _local text;
  _dom   text;
BEGIN
  IF _email IS NULL OR position('@' in _email) = 0 THEN
    RETURN NULL;
  END IF;
  _local := split_part(_email, '@', 1);
  _dom   := split_part(_email, '@', 2);
  IF length(_local) <= 2 THEN
    RETURN left(_local,1) || '***@' || _dom;
  END IF;
  RETURN left(_local,2) || '***@' || _dom;
END;
$$;

REVOKE ALL ON FUNCTION public._mascarar_email(text) FROM PUBLIC, anon, authenticated;

-- 4. RPC pública (anon + authenticated) para registrar eventos
CREATE OR REPLACE FUNCTION public.log_auth_event(
  _evento text,
  _sucesso boolean DEFAULT true,
  _user_id uuid DEFAULT NULL,
  _email text DEFAULT NULL,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
  _safe_meta jsonb;
BEGIN
  -- valida o evento via CHECK na tabela; remove campos sensíveis do metadata
  _safe_meta := COALESCE(_metadata, '{}'::jsonb)
                  - 'password' - 'senha' - 'token' - 'access_token'
                  - 'refresh_token' - 'authorization';

  INSERT INTO public.auth_audit_log
    (evento, sucesso, user_id, email_mascarado, ip, user_agent, metadata)
  VALUES
    (_evento,
     COALESCE(_sucesso, true),
     _user_id,
     public._mascarar_email(_email),
     left(_ip, 64),
     left(_user_agent, 512),
     _safe_meta)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_auth_event(text, boolean, uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_auth_event(text, boolean, uuid, text, text, text, jsonb) TO anon, authenticated;

-- 5. Espelhar resets administrativos automaticamente
CREATE OR REPLACE FUNCTION public._mirror_admin_reset_to_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auth_audit_log
    (evento, sucesso, user_id, email_mascarado, ip, user_agent, metadata)
  VALUES
    ('admin_password_reset', true, NEW.target_user_id,
     public._mascarar_email(NEW.target_email),
     NEW.ip, NEW.user_agent,
     jsonb_build_object(
       'ator_id', NEW.ator_id,
       'ator_email_mascarado', public._mascarar_email(NEW.ator_email),
       'motivo', NEW.motivo
     ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_reset_to_audit ON public.admin_password_resets;
CREATE TRIGGER trg_admin_reset_to_audit
AFTER INSERT ON public.admin_password_resets
FOR EACH ROW EXECUTE FUNCTION public._mirror_admin_reset_to_audit();
