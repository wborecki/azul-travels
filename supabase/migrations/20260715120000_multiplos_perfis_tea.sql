-- ============================================================================
-- Múltiplos perfis TEA por família + foto por perfil + N perfis por reserva
-- ============================================================================

-- ============ 1) Família pode ter N filhos ============
-- Remove a trava "1 perfil por família" (versão antiga do produto).
DROP INDEX IF EXISTS public.perfil_sensorial_familia_unico;

-- Índice não-único para as listagens por família continuarem rápidas.
CREATE INDEX IF NOT EXISTS idx_perfil_sensorial_familia_id
  ON public.perfil_sensorial(familia_id);

-- ============ 2) Foto por perfil ============
ALTER TABLE public.perfil_sensorial
  ADD COLUMN IF NOT EXISTS foto_url text;

-- ============ 3) N perfis por reserva (join table) ============
CREATE TABLE IF NOT EXISTS public.reserva_perfis (
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  perfil_sensorial_id uuid NOT NULL REFERENCES public.perfil_sensorial(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reserva_id, perfil_sensorial_id)
);

CREATE INDEX IF NOT EXISTS idx_reserva_perfis_perfil_sensorial_id
  ON public.reserva_perfis(perfil_sensorial_id);

ALTER TABLE public.reserva_perfis ENABLE ROW LEVEL SECURITY;

-- Família gerencia os vínculos das próprias reservas, e só pode vincular
-- perfis que pertencem a ela.
CREATE POLICY "Family manages own reserva_perfis" ON public.reserva_perfis
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_perfis.reserva_id AND r.familia_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_perfis.reserva_id AND r.familia_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.perfil_sensorial p
      WHERE p.id = reserva_perfis.perfil_sensorial_id AND p.familia_id = auth.uid()
    )
  );

-- Dono do estabelecimento vê os vínculos das reservas do seu local quando a
-- família consentiu (mesmas condições de "Owner reads reservas of own estab").
CREATE POLICY "Owner reads reserva_perfis when consentida" ON public.reserva_perfis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reserva_perfis.reserva_id
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

CREATE POLICY "Admins view all reserva_perfis" ON public.reserva_perfis
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Backfill: reservas antigas com perfil único viram um vínculo na join table.
INSERT INTO public.reserva_perfis (reserva_id, perfil_sensorial_id)
SELECT r.id, r.perfil_sensorial_id
FROM public.reservas r
WHERE r.perfil_sensorial_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============ 4) LGPD: consentimento também via reserva_perfis ============
-- O dono precisa ler os N perfis vinculados (não só o da coluna legada
-- reservas.perfil_sensorial_id, que agora guarda apenas o 1º selecionado).
DROP POLICY IF EXISTS "Owner reads perfil_sensorial when reserva consentida" ON public.perfil_sensorial;
CREATE POLICY "Owner reads perfil_sensorial when reserva consentida" ON public.perfil_sensorial
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE (
          r.perfil_sensorial_id = perfil_sensorial.id
          OR EXISTS (
            SELECT 1 FROM public.reserva_perfis rp
            WHERE rp.reserva_id = r.id
              AND rp.perfil_sensorial_id = perfil_sensorial.id
          )
        )
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );

-- ============ 5) Bucket para fotos dos perfis ============
-- Arquivos ficam em pastas por família: <familia_id>/<uuid>.<ext>
INSERT INTO storage.buckets (id, name, public)
VALUES ('perfis-tea-fotos', 'perfis-tea-fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads perfis-tea-fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'perfis-tea-fotos');

CREATE POLICY "Family uploads own perfis-tea-fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'perfis-tea-fotos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Family updates own perfis-tea-fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'perfis-tea-fotos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Family deletes own perfis-tea-fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'perfis-tea-fotos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins manage perfis-tea-fotos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'perfis-tea-fotos' AND public.has_role(auth.uid(), 'admin'));
