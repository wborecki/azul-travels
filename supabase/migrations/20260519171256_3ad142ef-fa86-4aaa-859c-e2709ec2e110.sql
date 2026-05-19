ALTER TYPE public.estab_tipo ADD VALUE IF NOT EXISTS 'passeio_educativo';

ALTER TABLE public.estabelecimentos
  ADD COLUMN IF NOT EXISTS subtipo_educativo text;

COMMENT ON COLUMN public.estabelecimentos.subtipo_educativo IS
  'Subcategoria para passeios educativos: fazenda, sitio, museu, parque_tematico, aquario, zoologico, espaco_cultural.';