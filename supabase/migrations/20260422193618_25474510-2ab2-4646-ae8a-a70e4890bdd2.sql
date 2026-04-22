-- Filtros padrão de exploração por usuário (1:1).
-- Reaplica selos/recursos/tipos automaticamente ao abrir /explorar
-- sem query string. Não captura busca textual nem estado para evitar
-- "favoritar sem querer" um termo de busca específico.

CREATE TABLE public.explorar_filtros_padrao (
  user_id uuid PRIMARY KEY,
  tipos public.estab_tipo[] NOT NULL DEFAULT '{}',
  selos text[] NOT NULL DEFAULT '{}',
  recursos text[] NOT NULL DEFAULT '{}',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.explorar_filtros_padrao ENABLE ROW LEVEL SECURITY;

-- Cada usuário só lê / escreve / apaga seu próprio registro.
CREATE POLICY "Users select own explorar filtros"
  ON public.explorar_filtros_padrao
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own explorar filtros"
  ON public.explorar_filtros_padrao
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own explorar filtros"
  ON public.explorar_filtros_padrao
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own explorar filtros"
  ON public.explorar_filtros_padrao
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Mantém atualizado_em em sync sem depender do client.
CREATE OR REPLACE FUNCTION public.touch_explorar_filtros_padrao()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_explorar_filtros_padrao
  BEFORE UPDATE ON public.explorar_filtros_padrao
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_explorar_filtros_padrao();