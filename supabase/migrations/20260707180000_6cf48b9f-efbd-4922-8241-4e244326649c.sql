-- Preço passa a ser obrigatório e sempre por noite (não é mais "sob consulta").

UPDATE public.opcoes_reserva SET preco = 0 WHERE preco IS NULL;

ALTER TABLE public.opcoes_reserva ALTER COLUMN preco SET NOT NULL;
ALTER TABLE public.opcoes_reserva
  ADD CONSTRAINT opcoes_reserva_preco_check CHECK (preco > 0);
