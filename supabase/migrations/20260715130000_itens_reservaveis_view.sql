-- F1: View unificada de itens reserváveis + contexto do estabelecimento
-- para o novo sistema de busca do /explorar.
--
-- security_invoker = true faz a view herdar a RLS das tabelas base,
-- garantindo que a política pública de itens_reservaveis
-- (ativo + selo_azul do estabelecimento) continue valendo.
--
-- A localização efetiva respeita `usa_endereco_proprio` do item:
-- quando true, usa cidade/estado/lat/lng do próprio item;
-- quando false, usa os dados do estabelecimento.
--
-- A avaliação média vem de um LEFT JOIN LATERAL que agrega apenas
-- avaliações públicas com nota_geral preenchida.

CREATE VIEW public.itens_reservaveis_view WITH (security_invoker = true) AS
SELECT
  ir.id,
  ir.nome AS item_nome,
  ir.descricao,
  ir.preco,
  ir.quantidade,
  ir.capacidade_total,
  ir.capacidade_adultos,
  ir.capacidade_criancas,
  ir.comodidades,
  ir.quantidade_camas,
  ir.imagens,
  ir.check_in_padrao,
  ir.check_out_padrao,

  -- Localização efetiva (endereço próprio do item ou do estabelecimento)
  CASE WHEN ir.usa_endereco_proprio THEN ir.cidade ELSE e.cidade END AS cidade,
  CASE WHEN ir.usa_endereco_proprio THEN ir.estado ELSE e.estado END AS estado,
  CASE WHEN ir.usa_endereco_proprio THEN ir.endereco ELSE e.endereco END AS endereco,
  CASE WHEN ir.usa_endereco_proprio THEN ir.latitude ELSE e.latitude END AS latitude,
  CASE WHEN ir.usa_endereco_proprio THEN ir.longitude ELSE e.longitude END AS longitude,

  -- Contexto do estabelecimento
  e.id AS estabelecimento_id,
  e.nome AS estabelecimento_nome,
  e.slug AS estabelecimento_slug,
  e.tipo AS estabelecimento_tipo,
  e.foto_capa AS estabelecimento_foto_capa,
  e.tour_360_url AS estabelecimento_tour_360_url,

  -- Selos
  e.selo_azul,
  e.selo_azul_validade,
  e.selo_governamental,
  e.selo_privado,
  e.selo_privado_nome,

  -- Flags TEA
  e.tem_beneficio_tea,
  e.beneficio_tea_descricao,
  e.tem_sala_sensorial,
  e.tem_concierge_tea,
  e.tem_checkin_antecipado,
  e.tem_fila_prioritaria,
  e.tem_cardapio_visual,
  e.tem_caa,
  e.destaque,
  e.recebe_grupos_escolares_tea,

  -- Avaliação agregada (somente públicas com nota)
  av.avaliacao_media,
  av.total_avaliacoes

FROM public.itens_reservaveis ir
JOIN public.estabelecimentos e ON e.id = ir.estabelecimento_id
LEFT JOIN LATERAL (
  SELECT
    AVG(a.nota_geral)::numeric(3,2) AS avaliacao_media,
    COUNT(*)::integer AS total_avaliacoes
  FROM public.avaliacoes a
  WHERE a.estabelecimento_id = e.id
    AND a.publica = true
    AND a.nota_geral IS NOT NULL
) av ON true
WHERE ir.ativo = true
  AND e.status = 'ativo'
  AND e.selo_azul = true;

GRANT SELECT ON public.itens_reservaveis_view TO anon, authenticated;

-- Índices nas tabelas base para acelerar os filtros da view
-- (índices compostos não podem ser criados na view - são criados nas
--  tabelas base, seguindo a orientação da correção #3 do plano).

CREATE INDEX IF NOT EXISTS idx_itens_reservaveis_preco
  ON public.itens_reservaveis(preco);

CREATE INDEX IF NOT EXISTS idx_itens_reservaveis_capacidade_total
  ON public.itens_reservaveis(capacidade_total);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_tipo_estado
  ON public.estabelecimentos(tipo, estado);
