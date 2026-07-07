-- Preço passa a ser obrigatório e sempre por noite (não é mais "sob consulta").

UPDATE public.itens_reservaveis SET preco = 0 WHERE preco IS NULL;

ALTER TABLE public.itens_reservaveis ALTER COLUMN preco SET NOT NULL;
ALTER TABLE public.itens_reservaveis
  ADD CONSTRAINT itens_reservaveis_preco_check CHECK (preco > 0);
