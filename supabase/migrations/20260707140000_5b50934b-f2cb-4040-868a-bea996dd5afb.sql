-- Bucket público para fotos de itens reserváveis (Fase 1)
INSERT INTO storage.buckets (id, name, public)
VALUES ('itens-reservaveis-fotos', 'itens-reservaveis-fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads itens-reservaveis-fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'itens-reservaveis-fotos');

CREATE POLICY "Owners upload itens-reservaveis-fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Owners update itens-reservaveis-fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Owners delete itens-reservaveis-fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Admins manage itens-reservaveis-fotos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'itens-reservaveis-fotos' AND public.has_role(auth.uid(), 'admin'));
