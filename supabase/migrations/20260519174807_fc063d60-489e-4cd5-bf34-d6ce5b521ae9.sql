
ALTER TABLE public.estabelecimentos
  ADD COLUMN IF NOT EXISTS quer_selo_azul boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quer_selo_azul_em timestamptz;

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_quer_selo_azul
  ON public.estabelecimentos(quer_selo_azul_em DESC)
  WHERE quer_selo_azul = true;
