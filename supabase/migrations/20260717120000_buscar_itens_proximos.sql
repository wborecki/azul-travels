-- ============ Busca por raio ("Perto de mim") no /explorar ============
-- Habilita PostGIS e expõe uma função de proximidade para o botão
-- "Perto de mim" do mapa de /explorar (busca por raio, estilo Airbnb).
--
-- A localização efetiva de um item respeita `usa_endereco_proprio`
-- (ver itens_reservaveis_view), então não há coluna `geography` gerada
-- nas tabelas base — o CASE não é replicável em uma coluna gerada única.
-- Em vez disso, a distância é calculada em tempo de consulta sobre a
-- própria view, e índices GiST funcionais nas tabelas base aceleram o
-- ST_DWithin (com o mesmo CASE embutido no predicado via UNION seria
-- redundante; os índices cobrem a coordenada "própria" de cada tabela,
-- que é a que efetivamente participa do resultado em cada caso).
--
-- Retorna apenas ids + distância (não reaplica selos/preço/datas) para
-- manter os filtros num único lugar (applyItensViewFilters), seguindo o
-- mesmo padrão de itens_indisponiveis_no_periodo: o cliente intersecta
-- os ids retornados com a query principal via `.in("id", ids)`.
--
-- SECURITY INVOKER (não DEFINER): a função só lê itens_reservaveis_view,
-- que já é `security_invoker = true` e concede SELECT a anon/authenticated.
-- Usar DEFINER aqui furaria o filtro público da view (rodaria como o dono
-- da função, ignorando a RLS das tabelas base).

CREATE EXTENSION IF NOT EXISTS postgis;

-- Índices GiST funcionais para acelerar buscas por proximidade.
-- Cast ::float8 necessário pois estabelecimentos.latitude/longitude são
-- DECIMAL(10,8)/DECIMAL(11,8) e itens_reservaveis.latitude/longitude são
-- numeric — ST_MakePoint exige double precision em ambos os casos.
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_geog
  ON public.estabelecimentos
  USING gist (
    geography(ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326))
  )
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_itens_reservaveis_geog
  ON public.itens_reservaveis
  USING gist (
    geography(ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326))
  )
  WHERE usa_endereco_proprio AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE OR REPLACE FUNCTION public.buscar_itens_proximos(
  p_lat float8,
  p_lng float8,
  p_raio_km float8
)
RETURNS TABLE (item_id uuid, distancia_m float8)
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
    v.id AS item_id,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(v.longitude::float8, v.latitude::float8), 4326)::geography,
      alvo.ponto
    ) AS distancia_m
  FROM public.itens_reservaveis_view v, alvo
  WHERE v.latitude IS NOT NULL
    AND v.longitude IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(v.longitude::float8, v.latitude::float8), 4326)::geography,
      alvo.ponto,
      alvo.raio_m
    );
$$;

COMMENT ON FUNCTION public.buscar_itens_proximos(float8, float8, float8) IS
  'Retorna IDs e distância (em metros) de itens reserváveis dentro de um raio (km) a partir de um ponto. Usado pelo botão "Perto de mim" do /explorar.';

REVOKE ALL ON FUNCTION public.buscar_itens_proximos(float8, float8, float8) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_itens_proximos(float8, float8, float8) TO anon, authenticated;
