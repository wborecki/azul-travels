
ALTER TABLE public.estabelecimento_profiles
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS num_colaboradores text,
  ADD COLUMN IF NOT EXISTS iniciativa_atual text,
  ADD COLUMN IF NOT EXISTS num_capacitacao text,
  ADD COLUMN IF NOT EXISTS contato_preferido text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS estrutura jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS perfil_completo boolean NOT NULL DEFAULT false;
