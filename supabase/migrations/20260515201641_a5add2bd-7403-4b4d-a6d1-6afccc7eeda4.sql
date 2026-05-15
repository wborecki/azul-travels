
REVOKE ALL ON FUNCTION public.promote_to_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
