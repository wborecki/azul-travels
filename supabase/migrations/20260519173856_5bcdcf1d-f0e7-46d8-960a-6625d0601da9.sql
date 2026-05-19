
-- 1) Tighten "WITH CHECK (true)" INSERT policies on public submission tables
DROP POLICY IF EXISTS "Public insert leads familias" ON public.leads_familias;
CREATE POLICY "Public insert leads familias" ON public.leads_familias
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(nome, '')) BETWEEN 1 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(coalesce(cidade, '')) BETWEEN 1 AND 120
    AND length(coalesce(estado, '')) BETWEEN 1 AND 60
  );

DROP POLICY IF EXISTS "Public insert leads estabelecimentos" ON public.leads_estabelecimentos;
CREATE POLICY "Public insert leads estabelecimentos" ON public.leads_estabelecimentos
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(nome, '')) BETWEEN 1 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(coalesce(nome_estabelecimento, '')) BETWEEN 1 AND 200
    AND length(coalesce(cidade, '')) BETWEEN 1 AND 120
    AND length(coalesce(estado, '')) BETWEEN 1 AND 60
  );

DROP POLICY IF EXISTS "Anyone can submit contato" ON public.contatos_gerais;
CREATE POLICY "Anyone can submit contato" ON public.contatos_gerais
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(nome, '')) BETWEEN 1 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(coalesce(mensagem, '')) BETWEEN 1 AND 5000
  );

DROP POLICY IF EXISTS "Anyone can submit estab contato" ON public.contatos_estabelecimentos;
CREATE POLICY "Anyone can submit estab contato" ON public.contatos_estabelecimentos
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(nome_responsavel, '')) BETWEEN 1 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(coalesce(nome_estabelecimento, '')) BETWEEN 1 AND 200
    AND length(coalesce(cidade, '')) BETWEEN 1 AND 120
  );

DROP POLICY IF EXISTS "Anyone can submit pre-checkin" ON public.pre_checkins;
CREATE POLICY "Anyone can submit pre-checkin" ON public.pre_checkins
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(nome_responsavel, '')) BETWEEN 1 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(coalesce(nome_autista, '')) BETWEEN 1 AND 200
    AND length(coalesce(estabelecimento_slug, '')) BETWEEN 1 AND 200
  );

-- 2) Stop allowing public LIST of storage buckets (files still served via public URL)
DROP POLICY IF EXISTS "Public reads estabelecimentos-fotos" ON storage.objects;
DROP POLICY IF EXISTS "Public reads conteudo-capas" ON storage.objects;

-- 3) Lock down SECURITY DEFINER functions — remove default PUBLIC execute
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.promote_to_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.expurgar_links_curtos_inativos() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.publicar_conteudo_agendado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_acesso_link_curto(text) FROM PUBLIC;

-- Trigger-only functions: nobody should call them directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validar_transicao_reserva_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_estabelecimento_auditoria() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_perfil_tea_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_explorar_filtros_padrao() FROM PUBLIC, anon, authenticated;

-- get_familias_count is intentionally public (used pelo site público)
-- mantém execute para anon/authenticated; nada a fazer aqui.
