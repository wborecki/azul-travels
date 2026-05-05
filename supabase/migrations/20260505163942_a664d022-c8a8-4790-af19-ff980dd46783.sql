CREATE TABLE public.contatos_gerais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  assunto text,
  mensagem text NOT NULL,
  origem text DEFAULT 'home',
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contatos_gerais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contato"
ON public.contatos_gerais
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins read contatos gerais"
ON public.contatos_gerais
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));