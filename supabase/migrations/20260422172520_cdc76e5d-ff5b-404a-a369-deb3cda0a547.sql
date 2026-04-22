INSERT INTO storage.buckets (id, name, public)
VALUES ('conteudo-capas', 'conteudo-capas', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads conteudo-capas"
ON storage.objects FOR SELECT
USING (bucket_id = 'conteudo-capas');

CREATE POLICY "Admins upload conteudo-capas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'conteudo-capas'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins update conteudo-capas"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'conteudo-capas'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins delete conteudo-capas"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'conteudo-capas'
  AND public.has_role(auth.uid(), 'admin')
);