-- Garante que slugs de estabelecimentos sejam únicos no banco
-- Caso já existam duplicados, a criação do índice falhará e será necessário
-- corrigi-los manualmente antes — mas no estado atual não há colisões.
CREATE UNIQUE INDEX IF NOT EXISTS estabelecimentos_slug_unique
  ON public.estabelecimentos (slug);