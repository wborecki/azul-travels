-- Tabela de auditoria de mudanças em reservas
CREATE TABLE public.reservas_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  ator_id uuid NOT NULL,
  ator_email text,
  acao text NOT NULL,
  status_anterior public.reserva_status,
  status_novo public.reserva_status,
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservas_auditoria_reserva ON public.reservas_auditoria(reserva_id, criado_em DESC);

ALTER TABLE public.reservas_auditoria ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler/escrever logs
CREATE POLICY "Admins read auditoria"
ON public.reservas_auditoria FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert auditoria"
ON public.reservas_auditoria FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND ator_id = auth.uid());