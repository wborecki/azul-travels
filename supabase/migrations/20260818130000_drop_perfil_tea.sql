-- ============================================================================
-- Aposenta `perfil_tea`
--
-- A tabela nunca teve formulário escrevendo nela e não tem dados reais em
-- produção. As colunas foram absorvidas por `perfil_sensorial` em
-- 20260818120000_perfil_tea_precheckin.sql, e os dois leitores que restavam
-- (painel do estabelecimento e gerador de PDF) já apontam para o modelo novo.
-- ============================================================================

-- ============ 1) Estatísticas do admin ============
-- `get_dashboard_stats` faz JOIN em perfil_tea no corpo plpgsql; o DROP TABLE
-- não a invalida, ela só passaria a estourar em runtime. Redefinida antes.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem consultar estatísticas';
  END IF;

  SELECT jsonb_build_object(
    'total_familias', (
      SELECT count(DISTINCT ur.user_id) FROM public.user_roles ur WHERE ur.role = 'user'
    ),
    'total_estabelecimentos', (
      SELECT count(DISTINCT ur.user_id) FROM public.user_roles ur WHERE ur.role = 'estabelecimento'
    ),
    'total_admins', (
      SELECT count(DISTINCT ur.user_id) FROM public.user_roles ur WHERE ur.role = 'admin'
    ),
    'novos_esta_semana', (
      SELECT (
        (SELECT count(*) FROM public.familia_profiles WHERE criado_em > now() - interval '7 days') +
        (SELECT count(*) FROM public.estabelecimento_profiles WHERE criado_em > now() - interval '7 days')
      )
    ),
    'familias_com_perfil_tea', (
      SELECT count(DISTINCT fp.id)
      FROM public.familia_profiles fp
      JOIN public.perfil_sensorial ps ON ps.familia_id = fp.id
    ),
    'estabelecimentos_com_perfil', (
      SELECT count(*) FROM public.estabelecimentos
      WHERE owner_user_id IS NOT NULL
        AND descricao IS NOT NULL
        AND length(coalesce(descricao,'')) > 0
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

-- ============ 2) Drop ============
-- A tabela vem primeiro: a policy "Owner reads perfil_tea when reserva
-- consentida" mora em `perfil_tea` mas lê `reservas.perfil_tea_id`, então
-- dropar a coluna antes da tabela falha com 2BP01 (dependência). O CASCADE
-- leva junto as policies e a FK que `reservas` tem para cá.

DROP TABLE IF EXISTS public.perfil_tea CASCADE;

DROP INDEX IF EXISTS public.idx_reservas_perfil_tea_id;

ALTER TABLE public.reservas
  DROP COLUMN IF EXISTS perfil_tea_id;

DROP FUNCTION IF EXISTS public.touch_perfil_tea_updated_at() CASCADE;
