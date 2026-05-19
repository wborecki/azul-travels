
CREATE OR REPLACE FUNCTION public.get_familias_count()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem consultar esta contagem';
  END IF;
  RETURN (SELECT count(*)::int FROM public.familia_profiles);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_familias_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_familias_count() TO authenticated;
