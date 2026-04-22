-- 1) Coluna publicar_em (timestamptz, opcional)
ALTER TABLE public.conteudo_tea
  ADD COLUMN IF NOT EXISTS publicar_em timestamptz NULL;

COMMENT ON COLUMN public.conteudo_tea.publicar_em IS
  'Quando preenchido e <= now(), o artigo é considerado publicado. Job pg_cron normaliza publicado=true periodicamente.';

-- 2) Índice para o cron e filtros de "agendados"
CREATE INDEX IF NOT EXISTS idx_conteudo_tea_publicar_em
  ON public.conteudo_tea (publicar_em)
  WHERE publicado = false AND publicar_em IS NOT NULL;

-- 3) Função que normaliza estado: agendados vencidos viram publicado=true
CREATE OR REPLACE FUNCTION public.publicar_conteudo_agendado()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _afetados integer;
BEGIN
  WITH upd AS (
    UPDATE public.conteudo_tea
       SET publicado = true
     WHERE publicado = false
       AND publicar_em IS NOT NULL
       AND publicar_em <= now()
    RETURNING 1
  )
  SELECT count(*) INTO _afetados FROM upd;
  RETURN _afetados;
END;
$$;

-- 4) Cron a cada 5 minutos
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove versões anteriores se existirem (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publicar-conteudo-agendado-5min') THEN
    PERFORM cron.unschedule('publicar-conteudo-agendado-5min');
  END IF;
END $$;

SELECT cron.schedule(
  'publicar-conteudo-agendado-5min',
  '*/5 * * * *',
  $$ SELECT public.publicar_conteudo_agendado(); $$
);

-- 5) RLS pública: permite ler artigos agendados cuja data já chegou
--    (mesmo que o cron ainda não tenha rodado). Mantém a regra anterior.
DROP POLICY IF EXISTS "Public reads published conteudo" ON public.conteudo_tea;
CREATE POLICY "Public reads published or due conteudo"
  ON public.conteudo_tea
  FOR SELECT
  TO anon, authenticated
  USING (
    publicado = true
    OR (publicar_em IS NOT NULL AND publicar_em <= now())
  );