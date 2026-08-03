-- Coluna is_demo para distinguir registros criados em testes/demonstração de registros reais.
ALTER TABLE public.leads_familias        ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads_estabelecimentos ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.familia_profiles      ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.estabelecimentos      ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_leads_familias_is_demo        ON public.leads_familias (is_demo);
CREATE INDEX IF NOT EXISTS idx_leads_estabelecimentos_is_demo ON public.leads_estabelecimentos (is_demo);
CREATE INDEX IF NOT EXISTS idx_familia_profiles_is_demo      ON public.familia_profiles (is_demo);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_is_demo      ON public.estabelecimentos (is_demo);