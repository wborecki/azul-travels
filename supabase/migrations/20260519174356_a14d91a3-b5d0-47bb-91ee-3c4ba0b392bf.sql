
REVOKE EXECUTE ON FUNCTION public.get_familias_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_familias_count() TO authenticated;
