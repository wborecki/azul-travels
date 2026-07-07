-- Quantidade de camas passa a ser obrigatória (era opcional).

UPDATE public.opcoes_reserva SET quantidade_camas = 1 WHERE quantidade_camas IS NULL;

ALTER TABLE public.opcoes_reserva ALTER COLUMN quantidade_camas SET NOT NULL;
ALTER TABLE public.opcoes_reserva ALTER COLUMN quantidade_camas SET DEFAULT 1;

ALTER TABLE public.opcoes_reserva
  DROP CONSTRAINT IF EXISTS opcoes_reserva_quantidade_camas_check;
ALTER TABLE public.opcoes_reserva
  ADD CONSTRAINT opcoes_reserva_quantidade_camas_check CHECK (quantidade_camas > 0);
