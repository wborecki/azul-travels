ALTER TABLE public.estabelecimentos
  ADD COLUMN IF NOT EXISTS recebe_grupos_escolares_tea boolean NOT NULL DEFAULT false;