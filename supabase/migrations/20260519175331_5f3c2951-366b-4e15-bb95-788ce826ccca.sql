
REVOKE EXECUTE ON FUNCTION public.log_admin_password_reset(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_admin_password_reset(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_admin_password_reset(uuid, text) FROM authenticated;
