-- Tabela de leads de famílias TEA
CREATE TABLE IF NOT EXISTS public.leads_familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  status_diagnostico TEXT,
  num_filhos_tea TEXT,
  preocupacoes TEXT[] DEFAULT '{}',
  como_conheceu TEXT,
  origem TEXT DEFAULT 'home',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS leads_familias_email_unique ON public.leads_familias (lower(email));

ALTER TABLE public.leads_familias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert leads familias"
  ON public.leads_familias FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public read leads familias"
  ON public.leads_familias FOR SELECT
  TO anon, authenticated
  USING (true);

-- Tabela de leads de estabelecimentos
CREATE TABLE IF NOT EXISTS public.leads_estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  nome_estabelecimento TEXT NOT NULL,
  tipo TEXT,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  num_colaboradores TEXT,
  iniciativa_atual TEXT,
  interesses TEXT[] DEFAULT '{}',
  como_conheceu TEXT,
  origem TEXT DEFAULT 'home',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS leads_estabelecimentos_email_unique ON public.leads_estabelecimentos (lower(email));

ALTER TABLE public.leads_estabelecimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert leads estabelecimentos"
  ON public.leads_estabelecimentos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public read leads estabelecimentos"
  ON public.leads_estabelecimentos FOR SELECT
  TO anon, authenticated
  USING (true);