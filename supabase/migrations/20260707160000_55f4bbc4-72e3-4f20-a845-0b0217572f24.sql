ALTER TABLE public.itens_reservaveis
  ADD COLUMN usa_endereco_proprio boolean NOT NULL DEFAULT false,
  ADD COLUMN endereco text,
  ADD COLUMN cidade text,
  ADD COLUMN estado text,
  ADD COLUMN latitude numeric,
  ADD COLUMN longitude numeric;
