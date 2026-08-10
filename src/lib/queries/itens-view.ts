import { supabase } from "@/integrations/supabase/client";
import type { Tables, Database } from "@/integrations/supabase/types";
import { normalizeFotos } from "@/lib/media";
import { PAGE_SIZE_DEFAULT, resolvePagination } from "./pagination";

export const ITEM_PAGE_SIZE_DEFAULT = PAGE_SIZE_DEFAULT;

type ItemViewRaw = Tables<"ofertas_view">;

export type SeloFlag = "selo_azul" | "selo_governamental" | "selo_privado";

export type RecursoFlag =
  | "tem_sala_sensorial"
  | "tem_concierge_tea"
  | "tem_checkin_antecipado"
  | "tem_fila_prioritaria"
  | "tem_cardapio_visual"
  | "tem_caa";

export type Ordenacao = "preco_asc" | "preco_desc" | "avaliacao";

export interface ItemView {
  /**
   * `estadia` = um quarto; `visita` = o próprio estabelecimento. Nas visitas
   * preço, capacidade, camas e check-in/out são nulos - o local não declara
   * nada disso, ele confirma ou recusa o pedido.
   */
  natureza: ItemViewRaw["natureza"];
  id: string;
  item_nome: string;
  descricao: string | null;
  preco: number | null;
  quantidade: number | null;
  capacidade_total: number | null;
  capacidade_adultos: number | null;
  capacidade_criancas: number | null;
  comodidades: string[];
  quantidade_camas: number | null;
  imagens: string[];
  check_in_padrao: string | null;
  check_out_padrao: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  estabelecimento_id: string;
  estabelecimento_nome: string;
  estabelecimento_slug: string;
  estabelecimento_tipo: ItemViewRaw["estabelecimento_tipo"];
  estabelecimento_foto_capa: string | null;
  estabelecimento_tour_360_url: string | null;
  selo_azul: boolean | null;
  selo_azul_validade: string | null;
  selo_governamental: boolean | null;
  selo_privado: boolean | null;
  selo_privado_nome: string | null;
  tem_beneficio_tea: boolean | null;
  beneficio_tea_descricao: string | null;
  tem_sala_sensorial: boolean | null;
  tem_concierge_tea: boolean | null;
  tem_checkin_antecipado: boolean | null;
  tem_fila_prioritaria: boolean | null;
  tem_cardapio_visual: boolean | null;
  tem_caa: boolean | null;
  destaque: boolean | null;
  recebe_grupos_escolares_tea: boolean;
  avaliacao_media: number | null;
  total_avaliacoes: number;
}

export function normalizeItemView(row: ItemViewRaw): ItemView {
  return {
    ...row,
    imagens: normalizeFotos(row.imagens),
  };
}

export interface BoundingBox {
  norte: number;
  sul: number;
  leste: number;
  oeste: number;
}

export interface CentroBusca {
  lat: number;
  lng: number;
}

export interface ItensViewFilters {
  busca?: string;
  tipos?: ReadonlyArray<ItemViewRaw["estabelecimento_tipo"]>;
  selos?: ReadonlyArray<SeloFlag>;
  recursos?: ReadonlyArray<RecursoFlag>;
  estado?: string;
  cidade?: string;
  preco_min?: number;
  preco_max?: number;
  capacidade_min?: number;
  ordenacao?: Ordenacao;
  pagina?: number;
  tamanhoPagina?: number;
  data_in?: string;
  data_out?: string;
  /** Filtra por área visível do mapa (bbox e centro/raio são mutuamente exclusivos). */
  bbox?: BoundingBox;
  centro?: CentroBusca;
  raio_km?: number;
}

export interface ItensViewPage {
  items: ItemView[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

interface AnyItemViewBuilder {
  or(...args: unknown[]): unknown;
  eq(...args: unknown[]): unknown;
  in(...args: unknown[]): unknown;
  not(...args: unknown[]): unknown;
  limit(...args: unknown[]): unknown;
  range(...args: unknown[]): unknown;
  gte(...args: unknown[]): unknown;
  lte(...args: unknown[]): unknown;
  order(...args: unknown[]): unknown;
}

export function applyItensViewFilters<Q extends AnyItemViewBuilder>(
  query: Q,
  filters: ItensViewFilters = {},
): Q {
  let q = query;

  if (filters.busca && filters.busca.trim()) {
    const term = filters.busca.trim().replace(/[,()]/g, " ");
    q = q.or(
      `item_nome.ilike.%${term}%,estabelecimento_nome.ilike.%${term}%,cidade.ilike.%${term}%`,
    ) as Q;
  }

  const tipos = filters.tipos;
  if (tipos && tipos.length === 1) {
    q = q.eq("estabelecimento_tipo", tipos[0]) as Q;
  } else if (tipos && tipos.length > 1) {
    q = q.in("estabelecimento_tipo", tipos as readonly string[]) as Q;
  }

  if (filters.estado) q = q.eq("estado", filters.estado) as Q;
  if (filters.cidade) q = q.eq("cidade", filters.cidade) as Q;

  if (filters.preco_min !== undefined) q = q.gte("preco", filters.preco_min) as Q;
  if (filters.preco_max !== undefined) q = q.lte("preco", filters.preco_max) as Q;

  if (filters.capacidade_min !== undefined) {
    q = q.gte("capacidade_total", filters.capacidade_min) as Q;
  }

  if (filters.bbox) {
    const { norte, sul, leste, oeste } = filters.bbox;
    q = q.gte("latitude", sul) as Q;
    q = q.lte("latitude", norte) as Q;
    q = q.gte("longitude", oeste) as Q;
    q = q.lte("longitude", leste) as Q;
  }

  for (const s of filters.selos ?? []) q = q.eq(s, true) as Q;
  for (const r of filters.recursos ?? []) q = q.eq(r, true) as Q;

  q = q.order("selo_azul", { ascending: false, nullsFirst: false }) as Q;

  // `nullsFirst: false` em toda ordenação por preço: visita não tem preço, e
  // sem isso o DESC jogaria todos os restaurantes para o topo da lista.
  if (filters.ordenacao === "preco_desc") {
    q = q.order("preco", { ascending: false, nullsFirst: false }) as Q;
  } else if (filters.ordenacao === "avaliacao") {
    q = q.order("avaliacao_media", { ascending: false, nullsFirst: false }) as Q;
    q = q.order("total_avaliacoes", { ascending: false }) as Q;
    q = q.order("preco", { ascending: true, nullsFirst: false }) as Q;
  } else {
    q = q.order("preco", { ascending: true, nullsFirst: false }) as Q;
  }

  const pag = resolvePagination(filters);
  if (pag) {
    q = q.range(pag.from, pag.to) as Q;
  }

  return q;
}

/**
 * IDs de quartos lotados no período. Só existe estadia aqui: visita não tem
 * disponibilidade controlada (o local confirma ou recusa), e como o id de uma
 * visita é o do estabelecimento, ele nunca aparece nesta lista - ou seja, o
 * filtro de datas deixa as visitas passarem por construção.
 */
async function fetchItensIndisponiveis(data_in?: string, data_out?: string): Promise<string[]> {
  if (!data_in || !data_out) return [];
  const { data, error } = await supabase.rpc("itens_indisponiveis_no_periodo", {
    p_checkin: data_in,
    p_checkout: data_out,
  });
  if (error) {
    console.warn("Erro ao consultar disponibilidade, ignorando filtro de datas", error);
    return [];
  }
  return (data ?? []).map((r) => r.item_id);
}

/** Sentinela: nenhum item pode ter esse id, força um resultado vazio sem pular o filtro. */
const ID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

async function fetchIdsProximos(centro: CentroBusca, raioKm: number): Promise<string[]> {
  const { data, error } = await supabase.rpc("buscar_ofertas_proximas", {
    p_lat: centro.lat,
    p_lng: centro.lng,
    p_raio_km: raioKm,
  });
  if (error) {
    console.warn("Erro ao consultar ofertas próximas, ignorando filtro de raio", error);
    return [];
  }
  return (data ?? []).map((r) => r.oferta_id);
}

function applyProximidade<Q extends AnyItemViewBuilder>(query: Q, ids: string[]): Q {
  return query.in("id", ids.length > 0 ? ids : [ID_INEXISTENTE]) as Q;
}

export async function fetchItensViewPaginated(
  filters: ItensViewFilters = {},
): Promise<ItensViewPage> {
  const pag = resolvePagination({
    pagina: filters.pagina ?? 1,
    tamanhoPagina: filters.tamanhoPagina ?? ITEM_PAGE_SIZE_DEFAULT,
  })!;

  const unavailableIds = await fetchItensIndisponiveis(filters.data_in, filters.data_out);
  const proximosIds =
    filters.centro && filters.raio_km !== undefined
      ? await fetchIdsProximos(filters.centro, filters.raio_km)
      : null;

  const base = supabase.from("ofertas_view").select("*", { count: "exact" });

  const q = applyItensViewFilters(base, {
    ...filters,
    pagina: pag.pagina,
    tamanhoPagina: pag.tamanhoPagina,
  });

  const qComDisponibilidade =
    unavailableIds.length > 0
      ? (q.not("id", "in", `(${unavailableIds.join(",")})`) as typeof q)
      : q;

  const qComProximidade =
    proximosIds !== null
      ? (applyProximidade(qComDisponibilidade, proximosIds) as typeof qComDisponibilidade)
      : qComDisponibilidade;

  const { data, error, count } = await qComProximidade.returns<ItemViewRaw[]>();
  if (error) throw error;
  const total = count ?? 0;
  const items = (data ?? []).map(normalizeItemView);
  return {
    items,
    total,
    pagina: pag.pagina,
    tamanhoPagina: pag.tamanhoPagina,
    totalPaginas: Math.max(1, Math.ceil(total / pag.tamanhoPagina)),
  };
}

export const ITEM_MAPA_LIMITE = 500;

// `natureza` decide o formato do pino; `estabelecimento_slug` é o destino do
// clique numa visita, que vai para a página do local e não para /quartos/:id.
const ITEM_MAPA_SELECT =
  "natureza,id,item_nome,preco,latitude,longitude,imagens,cidade,estado,capacidade_total,quantidade_camas,selo_azul,avaliacao_media,total_avaliacoes,estabelecimento_nome,estabelecimento_slug,estabelecimento_tipo,estabelecimento_foto_capa";

type ItemMapaRaw = Pick<
  ItemViewRaw,
  | "natureza"
  | "id"
  | "item_nome"
  | "preco"
  | "latitude"
  | "longitude"
  | "imagens"
  | "cidade"
  | "estado"
  | "capacidade_total"
  | "quantidade_camas"
  | "selo_azul"
  | "avaliacao_media"
  | "total_avaliacoes"
  | "estabelecimento_nome"
  | "estabelecimento_slug"
  | "estabelecimento_tipo"
  | "estabelecimento_foto_capa"
>;

export interface ItemMapa extends Omit<ItemMapaRaw, "imagens" | "latitude" | "longitude"> {
  imagens: string[];
  latitude: number;
  longitude: number;
}

export interface ItensViewMapa {
  items: ItemMapa[];
  total: number;
  truncado: boolean;
}

export async function fetchItensViewMapa(filters: ItensViewFilters = {}): Promise<ItensViewMapa> {
  const unavailableIds = await fetchItensIndisponiveis(filters.data_in, filters.data_out);
  const proximosIds =
    filters.centro && filters.raio_km !== undefined
      ? await fetchIdsProximos(filters.centro, filters.raio_km)
      : null;

  const base = supabase.from("ofertas_view").select(ITEM_MAPA_SELECT, { count: "exact" });

  const q = applyItensViewFilters(base, {
    ...filters,
    pagina: undefined,
    tamanhoPagina: undefined,
  });

  const comDisponibilidade =
    unavailableIds.length > 0
      ? (q.not("id", "in", `(${unavailableIds.join(",")})`) as typeof q)
      : q;

  const comProximidade =
    proximosIds !== null
      ? (applyProximidade(comDisponibilidade, proximosIds) as typeof comDisponibilidade)
      : comDisponibilidade;

  const { data, error, count } = await comProximidade
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(ITEM_MAPA_LIMITE)
    .returns<ItemMapaRaw[]>();

  if (error) throw error;

  const items: ItemMapa[] = (data ?? []).flatMap((row) =>
    row.latitude === null || row.longitude === null
      ? []
      : [
          {
            ...row,
            latitude: row.latitude,
            longitude: row.longitude,
            imagens: normalizeFotos(row.imagens),
          },
        ],
  );

  const total = count ?? items.length;
  return { items, total, truncado: total > items.length };
}
