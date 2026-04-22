-- ───────────────────────────────────────────────────────────────
-- explorar_links_curtos
-- ───────────────────────────────────────────────────────────────
-- Encurtador interno para URLs do /explorar. Slug é gerado no
-- application code (8 chars base62) e validado pelo CHECK.
--
-- Dedupe por `path_hash` (sha256 hex do path completo) — assim o
-- mesmo conjunto de filtros sempre devolve o mesmo slug, sem precisar
-- comparar a string longa nem manter índice unique gigante.
--
-- `ultimo_acesso_em` é atualizado a cada visita pela rota /l/$slug.
-- A função de expurgo apaga registros sem acesso há 90+ dias.

CREATE TABLE public.explorar_links_curtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE
    CHECK (slug ~ '^[A-Za-z0-9]{6,16}$'),
  path text NOT NULL
    CHECK (path LIKE '/explorar%' AND length(path) <= 4000),
  path_hash text NOT NULL UNIQUE
    CHECK (path_hash ~ '^[a-f0-9]{64}$'),
  -- Quem criou. NULL = criado por usuário não logado (não permitido
  -- hoje pela RLS, mas mantido NULLable para futuras campanhas).
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  ultimo_acesso_em timestamptz NOT NULL DEFAULT now()
);

-- Índice usado pelo expurgo — varredura por data de inatividade.
CREATE INDEX idx_explorar_links_curtos_ultimo_acesso
  ON public.explorar_links_curtos (ultimo_acesso_em);

ALTER TABLE public.explorar_links_curtos ENABLE ROW LEVEL SECURITY;

-- Leitura pública: qualquer um (anon ou auth) pode resolver o slug
-- para o path original. Esse é exatamente o caso de uso do link curto.
CREATE POLICY "Anyone can resolve a short link"
  ON public.explorar_links_curtos
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Criação: somente usuários logados, e o `criado_por` (quando
-- preenchido) precisa ser o próprio. Permite NULL para fluxos futuros.
CREATE POLICY "Authenticated users can create short links"
  ON public.explorar_links_curtos
  FOR INSERT
  TO authenticated
  WITH CHECK (criado_por IS NULL OR criado_por = auth.uid());

-- Não há policy de UPDATE/DELETE diretamente para o usuário —
-- atualização de `ultimo_acesso_em` e expurgo são feitos por
-- funções SECURITY DEFINER controladas.

-- ───────────────────────────────────────────────────────────────
-- registrar_acesso_link_curto: marca uso e devolve o path original.
-- ───────────────────────────────────────────────────────────────
-- SECURITY DEFINER porque atualiza linha (não há policy de UPDATE
-- para o caller), e porque precisa funcionar para anon. Search path
-- travado em `public` por boas práticas.
CREATE OR REPLACE FUNCTION public.registrar_acesso_link_curto(_slug text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _path text;
BEGIN
  UPDATE public.explorar_links_curtos
     SET ultimo_acesso_em = now()
   WHERE slug = _slug
   RETURNING path INTO _path;

  RETURN _path;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_acesso_link_curto(text) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_acesso_link_curto(text) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────
-- expurgar_links_curtos_inativos: limpeza automática (cron).
-- ───────────────────────────────────────────────────────────────
-- Apaga links sem acesso há 90+ dias. Devolve a quantidade removida
-- para facilitar observabilidade do cron job.
CREATE OR REPLACE FUNCTION public.expurgar_links_curtos_inativos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _removidos integer;
BEGIN
  WITH del AS (
    DELETE FROM public.explorar_links_curtos
     WHERE ultimo_acesso_em < now() - interval '90 days'
    RETURNING 1
  )
  SELECT count(*) INTO _removidos FROM del;

  RETURN _removidos;
END;
$$;

REVOKE ALL ON FUNCTION public.expurgar_links_curtos_inativos() FROM public;
-- Sem GRANT para anon/auth — só roles administrativas (postgres) podem chamar.