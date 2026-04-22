-- Bucket público para fotos de estabelecimentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('estabelecimentos-fotos', 'estabelecimentos-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública
CREATE POLICY "Public reads estabelecimentos-fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'estabelecimentos-fotos');

-- Apenas admins podem inserir/atualizar/excluir fotos
CREATE POLICY "Admins upload estabelecimentos-fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'estabelecimentos-fotos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins update estabelecimentos-fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'estabelecimentos-fotos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins delete estabelecimentos-fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'estabelecimentos-fotos'
  AND public.has_role(auth.uid(), 'admin')
);