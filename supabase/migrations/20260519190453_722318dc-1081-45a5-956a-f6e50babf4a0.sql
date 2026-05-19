-- Retenção/TTL para auth_audit_log (180 dias) e admin_password_resets (365 dias).
-- Funções SECURITY DEFINER restritas a service_role; o pg_cron chamará via execução interna.

CREATE OR REPLACE FUNCTION public.expurgar_auth_audit_log(_dias integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _removidos integer;
BEGIN
  IF _dias IS NULL OR _dias < 30 THEN
    RAISE EXCEPTION 'Período mínimo de retenção é 30 dias';
  END IF;

  WITH del AS (
    DELETE FROM public.auth_audit_log
     WHERE criado_em < now() - make_interval(days => _dias)
    RETURNING 1
  )
  SELECT count(*) INTO _removidos FROM del;

  RETURN _removidos;
END;
$$;

CREATE OR REPLACE FUNCTION public.expurgar_admin_password_resets(_dias integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _removidos integer;
BEGIN
  IF _dias IS NULL OR _dias < 90 THEN
    RAISE EXCEPTION 'Período mínimo de retenção é 90 dias';
  END IF;

  WITH del AS (
    DELETE FROM public.admin_password_resets
     WHERE criado_em < now() - make_interval(days => _dias)
    RETURNING 1
  )
  SELECT count(*) INTO _removidos FROM del;

  RETURN _removidos;
END;
$$;

-- Restringe execução
REVOKE EXECUTE ON FUNCTION public.expurgar_auth_audit_log(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expurgar_admin_password_resets(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expurgar_auth_audit_log(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.expurgar_admin_password_resets(integer) TO service_role;

COMMENT ON FUNCTION public.expurgar_auth_audit_log(integer) IS
  'Retenção/TTL: apaga registros de auth_audit_log mais antigos que N dias (padrão 180). Mínimo 30 dias.';
COMMENT ON FUNCTION public.expurgar_admin_password_resets(integer) IS
  'Retenção/TTL: apaga registros de admin_password_resets mais antigos que N dias (padrão 365). Mínimo 90 dias.';