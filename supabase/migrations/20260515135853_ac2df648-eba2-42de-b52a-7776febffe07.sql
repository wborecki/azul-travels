CREATE TABLE public.pre_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL,
  estabelecimento_slug text NOT NULL,
  nome_autista text NOT NULL,
  idade integer,
  nome_responsavel text NOT NULL,
  email text NOT NULL,
  telefone text NOT NULL,
  data_checkin date,
  data_checkout date,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  origem text DEFAULT 'marketplace',
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit pre-checkin"
  ON public.pre_checkins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read all pre-checkins"
  ON public.pre_checkins
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_pre_checkins_estab ON public.pre_checkins(estabelecimento_id);
CREATE INDEX idx_pre_checkins_criado ON public.pre_checkins(criado_em DESC);