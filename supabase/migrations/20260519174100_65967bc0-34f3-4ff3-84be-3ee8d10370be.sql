
DROP POLICY IF EXISTS "Public read leads familias" ON public.leads_familias;
CREATE POLICY "Admins read leads familias" ON public.leads_familias
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public read leads estabelecimentos" ON public.leads_estabelecimentos;
CREATE POLICY "Admins read leads estabelecimentos" ON public.leads_estabelecimentos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
