-- Bucket público para fotos de opções de reserva (Fase 1)
INSERT INTO storage.buckets (id, name, public)
VALUES ('opcoes-reserva-fotos', 'opcoes-reserva-fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads opcoes-reserva-fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'opcoes-reserva-fotos');

CREATE POLICY "Owners upload opcoes-reserva-fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'opcoes-reserva-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Owners update opcoes-reserva-fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'opcoes-reserva-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Owners delete opcoes-reserva-fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'opcoes-reserva-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.selo_azul = true AND e.status = 'ativo'
  )
);

CREATE POLICY "Admins manage opcoes-reserva-fotos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'opcoes-reserva-fotos' AND public.has_role(auth.uid(), 'admin'));
