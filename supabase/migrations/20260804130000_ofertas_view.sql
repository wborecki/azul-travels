-- ============ Vitrine unificada: ofertas (Fase B1) ============
-- A busca do /explorar sempre listou **itens**: cada linha da
-- `itens_reservaveis_view` é um quarto. Isso deixa de fora todo
-- estabelecimento que não é hospedagem - um restaurante não tem item nenhum e
-- por isso não existe na busca, mesmo já recebendo reserva desde a Fase A.
--
-- A unidade da vitrine passa a ser a **oferta**, de duas naturezas:
--
--   estadia  uma linha de itens_reservaveis (quarto), reservada por noites
--   visita   o próprio estabelecimento, reservado por dia e horário
--
-- Os dois ramos são disjuntos por construção (`estab_e_hospedagem`): um
-- estabelecimento aparece como quartos ou como visita, nunca como os dois.
-- Sem isso, um restaurante que tivesse itens cadastrados apareceria duas
-- vezes na mesma busca.
--
-- Ver docs/plano-reserva-direta-estabelecimento.md, seção B1.

CREATE TYPE public.oferta_natureza AS ENUM ('estadia', 'visita');

-- ---- A regra de hospedagem em um lugar só ----
-- Estava inline na trigger da Fase A e passaria a estar também na view.
-- IMMUTABLE porque depende apenas do argumento - pode ser usada em índice ou
-- CHECK no futuro sem surpresa.

CREATE OR REPLACE FUNCTION public.estab_e_hospedagem(_tipo public.estab_tipo)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT _tipo IN ('hotel', 'pousada', 'resort');
$$;

COMMENT ON FUNCTION public.estab_e_hospedagem(public.estab_tipo) IS
  'Hospedagem reserva-se escolhendo um quarto; todo o resto reserva-se direto no estabelecimento. Fonte única desta regra no banco.';

-- Trigger da Fase A reescrita para consumir o helper, em vez de repetir a
-- lista de tipos. Comportamento idêntico.
CREATE OR REPLACE FUNCTION public.sincronizar_estabelecimento_id_reserva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tipo public.estab_tipo;
  _status public.estab_status;
  _selo boolean;
BEGIN
  IF NEW.item_reservavel_id IS NULL THEN
    IF TG_OP <> 'INSERT' THEN
      -- UPDATE do ON DELETE SET NULL: reserva histórica mantém a origem.
      NEW.estabelecimento_id := OLD.estabelecimento_id;
      RETURN NEW;
    END IF;

    IF NEW.estabelecimento_id IS NULL THEN
      RAISE EXCEPTION 'Reserva exige um item reservável ou um estabelecimento'
        USING ERRCODE = 'not_null_violation';
    END IF;

    SELECT tipo, status, coalesce(selo_azul, false)
      INTO _tipo, _status, _selo
    FROM public.estabelecimentos
    WHERE id = NEW.estabelecimento_id;

    IF _tipo IS NULL THEN
      RAISE EXCEPTION 'Estabelecimento não encontrado'
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF public.estab_e_hospedagem(_tipo) THEN
      RAISE EXCEPTION 'Este tipo de estabelecimento exige a escolha de um quarto'
        USING ERRCODE = 'check_violation', HINT = 'HOSPEDAGEM_EXIGE_ITEM';
    END IF;

    IF _status <> 'ativo' OR NOT _selo THEN
      RAISE EXCEPTION 'Este estabelecimento não está aberto para reservas'
        USING ERRCODE = 'check_violation', HINT = 'ESTAB_SEM_SELO_ATIVO';
    END IF;

    RETURN NEW;
  END IF;

  SELECT estabelecimento_id INTO NEW.estabelecimento_id
  FROM public.itens_reservaveis
  WHERE id = NEW.item_reservavel_id;

  RETURN NEW;
END;
$$;

-- ---- A view ----
-- `security_invoker = true` é obrigatório: é ele que faz a RLS de
-- `itens_reservaveis` continuar valendo no ramo de estadia. Sem isso a view
-- roda como dona e vaza item que o público não deveria ver.
--
-- Colunas que só existem em quarto (preço, capacidade, camas, check-in/out)
-- vêm NULL na visita. NULL e não zero: `preco >= X` e `preco <= X` são falsos
-- para NULL, então uma visita nunca é capturada por um filtro de faixa de
-- preço - que é o comportamento correto, já que ela não tem preço a comparar.

CREATE VIEW public.ofertas_view WITH (security_invoker = true) AS

-- ===== Estadia: um card por quarto =====
SELECT
  'estadia'::public.oferta_natureza AS natureza,
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

  e.id AS estabelecimento_id,
  e.nome AS estabelecimento_nome,
  e.slug AS estabelecimento_slug,
  e.tipo AS estabelecimento_tipo,
  e.foto_capa AS estabelecimento_foto_capa,
  e.tour_360_url AS estabelecimento_tour_360_url,

  e.selo_azul,
  e.selo_azul_validade,
  e.selo_governamental,
  e.selo_privado,
  e.selo_privado_nome,

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
  AND e.selo_azul = true
  AND public.estab_e_hospedagem(e.tipo)

UNION ALL

-- ===== Visita: um card por estabelecimento =====
-- O mesmo gate da Fase A (selo ativo): a trigger recusa o insert fora dele,
-- então mostrar na vitrine o que não pode ser reservado seria só frustração.
SELECT
  'visita'::public.oferta_natureza AS natureza,
  e.id,
  e.nome AS item_nome,
  e.descricao,
  NULL::numeric AS preco,
  NULL::integer AS quantidade,
  NULL::integer AS capacidade_total,
  NULL::integer AS capacidade_adultos,
  NULL::integer AS capacidade_criancas,
  '{}'::text[] AS comodidades,
  NULL::integer AS quantidade_camas,
  -- A galeria do local, caindo para a foto de capa quando não há galeria.
  CASE
    WHEN jsonb_typeof(e.fotos::jsonb) = 'array' AND jsonb_array_length(e.fotos::jsonb) > 0
      THEN e.fotos::jsonb
    WHEN e.foto_capa IS NOT NULL
      THEN jsonb_build_array(e.foto_capa)
    ELSE '[]'::jsonb
  END AS imagens,
  NULL::time AS check_in_padrao,
  NULL::time AS check_out_padrao,

  e.cidade,
  e.estado,
  e.endereco,
  e.latitude,
  e.longitude,

  e.id AS estabelecimento_id,
  e.nome AS estabelecimento_nome,
  e.slug AS estabelecimento_slug,
  e.tipo AS estabelecimento_tipo,
  e.foto_capa AS estabelecimento_foto_capa,
  e.tour_360_url AS estabelecimento_tour_360_url,

  e.selo_azul,
  e.selo_azul_validade,
  e.selo_governamental,
  e.selo_privado,
  e.selo_privado_nome,

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

  av.avaliacao_media,
  av.total_avaliacoes

FROM public.estabelecimentos e
LEFT JOIN LATERAL (
  SELECT
    AVG(a.nota_geral)::numeric(3,2) AS avaliacao_media,
    COUNT(*)::integer AS total_avaliacoes
  FROM public.avaliacoes a
  WHERE a.estabelecimento_id = e.id
    AND a.publica = true
    AND a.nota_geral IS NOT NULL
) av ON true
WHERE e.status = 'ativo'
  AND e.selo_azul = true
  AND NOT public.estab_e_hospedagem(e.tipo);

GRANT SELECT ON public.ofertas_view TO anon, authenticated;

COMMENT ON VIEW public.ofertas_view IS
  'Fonte única da busca do /explorar. Une quartos (natureza=estadia) e estabelecimentos reserváveis direto (natureza=visita). A coluna `id` é o id do quarto ou do estabelecimento conforme a natureza - é o identificador que o cliente usa em `.in("id", ...)`.';

-- ---- Proximidade sobre a nova fonte ----
-- Substitui `buscar_itens_proximos`: o nome e a coluna de retorno diziam
-- "item", e metade das linhas deixou de ser item. Os índices GiST das duas
-- tabelas base (criados em 20260717120000) continuam servindo - o ramo de
-- visita usa `idx_estabelecimentos_geog`.

DROP FUNCTION IF EXISTS public.buscar_itens_proximos(float8, float8, float8);

CREATE OR REPLACE FUNCTION public.buscar_ofertas_proximas(
  p_lat float8,
  p_lng float8,
  p_raio_km float8
)
RETURNS TABLE (oferta_id uuid, distancia_m float8)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  WITH alvo AS (
    SELECT
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS ponto,
      GREATEST(0, LEAST(p_raio_km, 500)) * 1000 AS raio_m
  )
  SELECT
    v.id AS oferta_id,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(v.longitude::float8, v.latitude::float8), 4326)::geography,
      alvo.ponto
    ) AS distancia_m
  FROM public.ofertas_view v, alvo
  WHERE v.latitude IS NOT NULL
    AND v.longitude IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(v.longitude::float8, v.latitude::float8), 4326)::geography,
      alvo.ponto,
      alvo.raio_m
    );
$$;

COMMENT ON FUNCTION public.buscar_ofertas_proximas(float8, float8, float8) IS
  'IDs e distância (metros) de ofertas dentro de um raio (km) a partir de um ponto. Usado pelo botão "Perto de mim" do /explorar.';

REVOKE ALL ON FUNCTION public.buscar_ofertas_proximas(float8, float8, float8) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_ofertas_proximas(float8, float8, float8) TO anon, authenticated;

-- A view antiga sai por último: `buscar_itens_proximos` dependia dela.
DROP VIEW public.itens_reservaveis_view;
