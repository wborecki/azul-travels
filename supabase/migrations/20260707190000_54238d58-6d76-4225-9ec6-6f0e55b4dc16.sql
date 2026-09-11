-- Quantidade de camas passa a ser obrigatória (era opcional).

UPDATE public.itens_reservaveis SET quantidade_camas = 1 WHERE quantidade_camas IS NULL;

ALTER TABLE public.itens_reservaveis ALTER COLUMN quantidade_camas SET NOT NULL;
ALTER TABLE public.itens_reservaveis ALTER COLUMN quantidade_camas SET DEFAULT 1;

ALTER TABLE public.itens_reservaveis
  DROP CONSTRAINT IF EXISTS itens_reservaveis_quantidade_camas_check;
ALTER TABLE public.itens_reservaveis
  ADD CONSTRAINT itens_reservaveis_quantidade_camas_check CHECK (quantidade_camas > 0);
