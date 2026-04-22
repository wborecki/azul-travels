-- Tabela de leads B2B vindos de /para-estabelecimentos
CREATE TABLE public.contatos_estabelecimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_responsavel TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  nome_estabelecimento TEXT NOT NULL,
  tipo_estabelecimento TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  num_colaboradores TEXT NOT NULL,
  interesses TEXT[] NOT NULL DEFAULT '{}',
  origem TEXT,
  mensagem TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contatos_estabelecimentos ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode enviar um contato
CREATE POLICY "Anyone can submit estab contato"
  ON public.contatos_estabelecimentos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas admins leem
CREATE POLICY "Admins read estab contatos"
  ON public.contatos_estabelecimentos
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_contatos_estabelecimentos_criado_em
  ON public.contatos_estabelecimentos (criado_em DESC);