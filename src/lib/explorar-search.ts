import { isEstabTipo, type EstabTipo } from "@/lib/enums";
import { ESTADOS_BR, parseDataISO, parseInteiroUrl } from "@/lib/brazil";
import type { ItemRecursoFlag, ItemSeloFlag, ItensViewFilters, Ordenacao } from "@/lib/queries";

export interface ExplorarSearch {
  busca?: string;
  tipos?: string;
  selos?: string;
  recursos?: string;
  estado?: string;
  cidade?: string;
  preco_min?: number;
  preco_max?: number;
  capacidade_min?: number;
  ordenacao?: Ordenacao;
  pagina?: number;
  data_in?: string;
  data_out?: string;
  perfil_tea_id?: string;
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

  const capacidade_min = parseInteiroUrl(s.capacidade_min, 1);

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

  const perfil_tea_id = parseTexto(s.perfil_tea_id, 64);

  return {
    ...(busca ? { busca } : {}),
    ...(tipos ? { tipos } : {}),
    ...(selos ? { selos } : {}),
    ...(recursos ? { recursos } : {}),
    ...(estado ? { estado } : {}),
    ...(cidade ? { cidade } : {}),
    ...(preco_min !== undefined ? { preco_min } : {}),
    ...(preco_max !== undefined ? { preco_max } : {}),
    ...(capacidade_min !== undefined ? { capacidade_min } : {}),
    ...(ordenacao ? { ordenacao } : {}),
    ...(pagina !== undefined ? { pagina } : {}),
    ...(data_in ? { data_in } : {}),
    ...(data_out ? { data_out } : {}),
    ...(perfil_tea_id ? { perfil_tea_id } : {}),
  };
}

export function searchToFilters(search: ExplorarSearch): ItensViewFilters {
  const tipos = parseTiposCsv(search.tipos);
  const selos = parseSelosCsv(search.selos);
  const recursos = parseRecursosCsv(search.recursos);
  return {
    busca: search.busca,
    tipos: tipos.length > 0 ? tipos : undefined,
    selos: selos.length > 0 ? selos : undefined,
    recursos: recursos.length > 0 ? recursos : undefined,
    estado: search.estado,
    cidade: search.cidade,
    preco_min: search.preco_min,
    preco_max: search.preco_max,
    capacidade_min: search.capacidade_min,
    ordenacao: search.ordenacao,
    pagina: search.pagina ?? 1,
  };
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
    search.capacidade_min !== undefined ||
    search.ordenacao !== undefined ||
    search.pagina !== undefined
  );
}

export function contarFiltrosAtivos(search: ExplorarSearch): number {
  let n = 0;
  if (search.estado) n += 1;
  if (search.cidade) n += 1;
  n += parseSelosCsv(search.selos).length;
  n += parseRecursosCsv(search.recursos).length;
  if (search.preco_min !== undefined) n += 1;
  if (search.preco_max !== undefined) n += 1;
  if (search.capacidade_min !== undefined) n += 1;
  return n;
}
