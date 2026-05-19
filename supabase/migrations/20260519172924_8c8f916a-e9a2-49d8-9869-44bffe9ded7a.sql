CREATE OR REPLACE FUNCTION public.get_familias_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.familia_profiles;
$$;
GRANT EXECUTE ON FUNCTION public.get_familias_count() TO anon, authenticated;