-- `is_demo` chega em itens_reservaveis.
--
-- A coluna existe desde 20260521234354 em leads_familias, leads_estabelecimentos,
-- familia_profiles, estabelecimentos e estabelecimento_profiles, "para distinguir
-- registros criados em testes/demonstração de registros reais". `itens_reservaveis`
-- ficou de fora porque nasceu depois (20260707130000) - o que significa que um
-- quarto semeado hoje é indistinguível de um quarto real cadastrado por um dono.
--
-- Fecha a lacuna com o mesmo formato das outras: NOT NULL DEFAULT false, mais o
-- índice parcial que o admin usa para filtrar.

ALTER TABLE public.itens_reservaveis
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_itens_reservaveis_is_demo
  ON public.itens_reservaveis (is_demo);

COMMENT ON COLUMN public.itens_reservaveis.is_demo IS
  'Marca registro de demonstração/teste. Ver supabase/seeds/demo_estabelecimentos.sql.';
