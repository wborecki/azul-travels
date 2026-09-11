ALTER TABLE public.itens_reservaveis
  ADD COLUMN capacidade_adultos integer NOT NULL DEFAULT 2 CHECK (capacidade_adultos > 0),
  ADD COLUMN capacidade_criancas integer NOT NULL DEFAULT 0 CHECK (capacidade_criancas >= 0);
