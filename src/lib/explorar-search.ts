import { isEstabTipo, naturezaDaReserva, type EstabTipo } from "@/lib/enums";
import { ESTADOS_BR, parseDataISO, parseInteiroUrl } from "@/lib/brazil";
import type { ItemRecursoFlag, ItemSeloFlag, ItensViewFilters, Ordenacao } from "@/lib/queries";

/**
 * Filtros que só fazem sentido em hospedagem. Preço por noite, período de
 * estadia e número de hóspedes não existem numa visita a restaurante ou
 * parque - e como a coluna correspondente vem nula na view, aplicá-los sobre
 * uma busca mista faria as visitas sumirem sem a família entender por quê.
 *
 * A UI esconde estes controles fora de hospedagem e limpa os valores; esta
 * lista é a fonte única de quais são.
 */
export const FILTROS_SO_HOSPEDAGEM = [
  "preco_min",
  "preco_max",
  "data_in",
  "data_out",
  "adultos",
  "criancas",
] as const;

export interface ExplorarSearch {
  busca?: string;
  tipos?: string;
  selos?: string;
  recursos?: string;
  estado?: string;
  cidade?: string;
  preco_min?: number;
  preco_max?: number;
  adultos?: number;
  criancas?: number;
  ordenacao?: Ordenacao;
  pagina?: number;
  data_in?: string;
  data_out?: string;
  /** Mostra o painel do mapa ao lado da lista (desktop) ou no lugar dela (mobile). */
  mapa?: boolean;
  /** Área visível do mapa ("buscar nesta área"). Mutuamente exclusivo com centro/raio. */
  bbox_n?: number;
  bbox_s?: number;
  bbox_e?: number;
  bbox_o?: number;
  /** Busca por raio ("perto de mim"). Presença de centro_* ignora o bbox. */
  centro_lat?: number;
  centro_lng?: number;
  raio_km?: number;
}

const SELO_FLAGS: Record<ItemSeloFlag, true> = {
  selo_azul: true,
  selo_governamental: true,
  selo_privado: true,
};
const RECURSO_FLAGS: Record<ItemRecursoFlag, true> = {
  tem_sala_sensorial: true,
  tem_concierge_tea: true,
  tem_checkin_antecipado: true,
  tem_fila_prioritaria: true,
  tem_cardapio_visual: true,
  tem_caa: true,
};

export const ITEM_SELO_FLAGS = Object.keys(SELO_FLAGS) as ItemSeloFlag[];
export const ITEM_RECURSO_FLAGS = Object.keys(RECURSO_FLAGS) as ItemRecursoFlag[];

const UF_SET = new Set<string>(ESTADOS_BR.map((uf) => uf.sigla));
const ORDENACOES = new Set<Ordenacao>(["preco_asc", "preco_desc", "avaliacao"]);

export const ORDENACAO_LABEL: Record<Ordenacao, string> = {
  preco_asc: "Menor preço",
  preco_desc: "Maior preço",
  avaliacao: "Melhor avaliado",
};

function parseTexto(v: unknown, max = 120): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, max);
  return t !== "" ? t : undefined;
}

function parseCsv<T extends string>(v: unknown, guard: (x: unknown) => x is T): T[] {
  if (typeof v !== "string") return [];
  const vistos = new Set<T>();
  for (const parte of v.split(",")) {
    const token = parte.trim();
    if (guard(token)) vistos.add(token);
  }
  return [...vistos];
}

function isSeloFlag(v: unknown): v is ItemSeloFlag {
  return typeof v === "string" && v in SELO_FLAGS;
}
function isRecursoFlag(v: unknown): v is ItemRecursoFlag {
  return typeof v === "string" && v in RECURSO_FLAGS;
}

export function parseTiposCsv(v: unknown): EstabTipo[] {
  return parseCsv(v, isEstabTipo);
}

/**
 * `true` quando a busca está restrita a hospedagem - é a condição para os
 * filtros de `FILTROS_SO_HOSPEDAGEM` aparecerem.
 *
 * Seleção vazia (a lista misturada, que é o estado inicial) conta como
 * "não é só hospedagem": mostrar um filtro de preço ali seria oferecer um
 * controle que apaga silenciosamente metade dos resultados.
 */
export function buscaSoDeHospedagem(tipos: ReadonlyArray<EstabTipo>): boolean {
  return tipos.length > 0 && tipos.every((t) => naturezaDaReserva(t) === "estadia");
}

/** Patch que limpa todos os filtros exclusivos de hospedagem. */
export function limparFiltrosDeHospedagem(): Partial<ExplorarSearch> {
  return Object.fromEntries(FILTROS_SO_HOSPEDAGEM.map((k) => [k, undefined]));
}
export function parseSelosCsv(v: unknown): ItemSeloFlag[] {
  return parseCsv(v, isSeloFlag);
}
export function parseRecursosCsv(v: unknown): ItemRecursoFlag[] {
  return parseCsv(v, isRecursoFlag);
}

export function csvOrUndefined(values: ReadonlyArray<string>): string | undefined {
  return values.length > 0 ? values.join(",") : undefined;
}

function parsePreco(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parseCoordenada(v: unknown, min: number, max: number): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

export function validateExplorarSearch(s: Record<string, unknown>): ExplorarSearch {
  const busca = parseTexto(s.busca);
  const tipos = csvOrUndefined(parseTiposCsv(s.tipos));
  const selos = csvOrUndefined(parseSelosCsv(s.selos));
  const recursos = csvOrUndefined(parseRecursosCsv(s.recursos));

  const ufBruta = parseTexto(s.estado, 2)?.toUpperCase();
  const estado = ufBruta && UF_SET.has(ufBruta) ? ufBruta : undefined;
  const cidade = parseTexto(s.cidade);

  let preco_min = parsePreco(s.preco_min);
  let preco_max = parsePreco(s.preco_max);
  if (preco_min !== undefined && preco_max !== undefined && preco_min > preco_max) {
    [preco_min, preco_max] = [preco_max, preco_min];
  }

  const adultos = parseInteiroUrl(s.adultos, 1);
  const criancas = parseInteiroUrl(s.criancas, 0);

  const ordenacao = ORDENACOES.has(s.ordenacao as Ordenacao)
    ? (s.ordenacao as Ordenacao)
    : undefined;

  const paginaBruta = parseInteiroUrl(s.pagina, 1);
  const pagina = paginaBruta !== undefined && paginaBruta > 1 ? paginaBruta : undefined;

  const data_in = typeof s.data_in === "string" && parseDataISO(s.data_in) ? s.data_in : undefined;
  const dataOutParseada = typeof s.data_out === "string" ? parseDataISO(s.data_out) : null;
  const data_out =
    data_in && dataOutParseada && dataOutParseada > (parseDataISO(data_in) as Date)
      ? (s.data_out as string)
      : undefined;

  const mapa = s.mapa === true || s.mapa === "true" ? true : undefined;

  // Centro/raio ("perto de mim") tem prioridade sobre bbox ("buscar nesta área") —
  // são mutuamente exclusivos.
  const centro_lat = parseCoordenada(s.centro_lat, -90, 90);
  const centro_lng = parseCoordenada(s.centro_lng, -180, 180);
  const temCentro = centro_lat !== undefined && centro_lng !== undefined;
  const raioBruto = parseCoordenada(s.raio_km, 0.1, 500);
  const raioValido = temCentro ? (raioBruto ?? 20) : undefined;

  let bbox_n: number | undefined;
  let bbox_s: number | undefined;
  let bbox_e: number | undefined;
  let bbox_o: number | undefined;
  if (!temCentro) {
    const n = parseCoordenada(s.bbox_n, -90, 90);
    const sul = parseCoordenada(s.bbox_s, -90, 90);
    const e = parseCoordenada(s.bbox_e, -180, 180);
    const o = parseCoordenada(s.bbox_o, -180, 180);
    if (
      n !== undefined &&
      sul !== undefined &&
      e !== undefined &&
      o !== undefined &&
      sul <= n &&
      o <= e
    ) {
      bbox_n = n;
      bbox_s = sul;
      bbox_e = e;
      bbox_o = o;
    }
  }

  return {
    ...(busca ? { busca } : {}),
    ...(tipos ? { tipos } : {}),
    ...(selos ? { selos } : {}),
    ...(recursos ? { recursos } : {}),
    ...(estado ? { estado } : {}),
    ...(cidade ? { cidade } : {}),
    ...(preco_min !== undefined ? { preco_min } : {}),
    ...(preco_max !== undefined ? { preco_max } : {}),
    ...(adultos !== undefined ? { adultos } : {}),
    ...(criancas !== undefined ? { criancas } : {}),
    ...(ordenacao ? { ordenacao } : {}),
    ...(pagina !== undefined ? { pagina } : {}),
    ...(mapa ? { mapa } : {}),
    ...(data_in ? { data_in } : {}),
    ...(data_out ? { data_out } : {}),
    ...(temCentro ? { centro_lat, centro_lng, raio_km: raioValido } : {}),
    ...(bbox_n !== undefined ? { bbox_n, bbox_s, bbox_e, bbox_o } : {}),
  };
}

export function totalHospedes(search: ExplorarSearch): number {
  return (search.adultos ?? 1) + (search.criancas ?? 0);
}

export function searchToFilters(search: ExplorarSearch): ItensViewFilters {
  const tipos = parseTiposCsv(search.tipos);
  const selos = parseSelosCsv(search.selos);
  const recursos = parseRecursosCsv(search.recursos);
  const hospedes = totalHospedes(search);

  const temCentro = search.centro_lat !== undefined && search.centro_lng !== undefined;
  const temBbox =
    !temCentro &&
    search.bbox_n !== undefined &&
    search.bbox_s !== undefined &&
    search.bbox_e !== undefined &&
    search.bbox_o !== undefined;

  return {
    busca: search.busca,
    tipos: tipos.length > 0 ? tipos : undefined,
    selos: selos.length > 0 ? selos : undefined,
    recursos: recursos.length > 0 ? recursos : undefined,
    estado: search.estado,
    cidade: search.cidade,
    preco_min: search.preco_min,
    preco_max: search.preco_max,
    capacidade_min: hospedes > 1 ? hospedes : undefined,
    ordenacao: search.ordenacao,
    pagina: search.pagina ?? 1,
    data_in: search.data_in,
    data_out: search.data_out,
    ...(temCentro
      ? { centro: { lat: search.centro_lat!, lng: search.centro_lng! }, raio_km: search.raio_km }
      : {}),
    ...(temBbox
      ? {
          bbox: {
            norte: search.bbox_n!,
            sul: search.bbox_s!,
            leste: search.bbox_e!,
            oeste: search.bbox_o!,
          },
        }
      : {}),
  };
}

/** Existe uma área de mapa ativa (bbox ou centro/raio) na busca atual. */
export function temAreaMapa(search: ExplorarSearch): boolean {
  return (
    (search.centro_lat !== undefined && search.centro_lng !== undefined) ||
    (search.bbox_n !== undefined &&
      search.bbox_s !== undefined &&
      search.bbox_e !== undefined &&
      search.bbox_o !== undefined)
  );
}

/** Remove bbox e centro/raio da busca, preservando os demais filtros. */
export function limparAreaMapa(search: ExplorarSearch): ExplorarSearch {
  const {
    bbox_n: _n,
    bbox_s: _s,
    bbox_e: _e,
    bbox_o: _o,
    centro_lat: _lat,
    centro_lng: _lng,
    raio_km: _raio,
    ...resto
  } = search;
  return resto;
}

export function temFiltrosRelevantes(search: ExplorarSearch): boolean {
  return (
    search.busca !== undefined ||
    search.tipos !== undefined ||
    search.selos !== undefined ||
    search.recursos !== undefined ||
    search.estado !== undefined ||
    search.cidade !== undefined ||
    search.preco_min !== undefined ||
    search.preco_max !== undefined ||
    search.adultos !== undefined ||
    search.criancas !== undefined ||
    search.ordenacao !== undefined ||
    search.pagina !== undefined ||
    search.data_in !== undefined ||
    search.data_out !== undefined
  );
}

export function contarFiltrosAtivos(search: ExplorarSearch): number {
  let n = 0;
  if (search.tipos) n += 1;
  if (search.estado) n += 1;
  if (search.cidade) n += 1;
  n += parseSelosCsv(search.selos).length;
  n += parseRecursosCsv(search.recursos).length;
  if (search.preco_min !== undefined) n += 1;
  if (search.preco_max !== undefined) n += 1;
  if (search.adultos !== undefined || search.criancas !== undefined) n += 1;
  if (search.data_in || search.data_out) n += 1;
  return n;
}
