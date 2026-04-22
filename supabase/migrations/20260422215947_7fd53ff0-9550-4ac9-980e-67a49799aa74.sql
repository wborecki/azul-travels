-- Tabela de eventos de analytics para conteúdo TEA
CREATE TABLE public.conteudo_eventos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conteudo_id uuid NOT NULL REFERENCES public.conteudo_tea(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('view', 'click')),
  url_alvo text,
  referrer text,
  sessao_id text,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_conteudo_eventos_conteudo_data
  ON public.conteudo_eventos (conteudo_id, criado_em DESC);

CREATE INDEX idx_conteudo_eventos_tipo_data
  ON public.conteudo_eventos (tipo, criado_em DESC);

ALTER TABLE public.conteudo_eventos ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode registrar eventos, desde que o artigo esteja
-- visível publicamente (publicado=true ou agendamento já vencido).
CREATE POLICY "Anyone can insert events for visible content"
  ON public.conteudo_eventos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conteudo_tea c
       WHERE c.id = conteudo_eventos.conteudo_id
         AND (c.publicado = true OR (c.publicar_em IS NOT NULL AND c.publicar_em <= now()))
    )
    AND tipo IN ('view', 'click')
  );

-- Apenas admins podem ler eventos.
CREATE POLICY "Admins read all events"
  ON public.conteudo_eventos
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));