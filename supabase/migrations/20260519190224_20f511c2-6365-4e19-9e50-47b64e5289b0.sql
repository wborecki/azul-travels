-- Trigger functions: nenhum cliente precisa executar diretamente
REVOKE ALL ON FUNCTION public._mirror_admin_reset_to_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._mascarar_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_estabelecimento_auditoria() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_explorar_filtros_padrao() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_perfil_tea_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validar_transicao_reserva_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.publicar_conteudo_agendado() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expurgar_links_curtos_inativos() FROM PUBLIC, anon, authenticated;

-- has_role só precisa ser executável pelo engine (RLS) → mantém para authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- RPCs administrativas: já têm self-guard interno; restringe a authenticated apenas
REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_familias_count() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promote_to_admin(uuid) FROM PUBLIC, anon;

-- Reset de senha pelo admin: só service_role (frontend chama via edge / server fn admin)
REVOKE ALL ON FUNCTION public.log_admin_password_reset(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_admin_password_reset(uuid, text, text, text) FROM PUBLIC, anon, authenticated;

-- log_auth_event: precisa ser callable por anon (registrar falhas de login)
-- registrar_acesso_link_curto: público intencional (redirecionador de links curtos)
-- Estas permanecem com EXECUTE para anon+authenticated por design.