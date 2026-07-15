export const PAGE_SIZE_MAX = 100;
export const PAGE_SIZE_DEFAULT = 24;

export interface ResolvedPagination {
  pagina: number;
  tamanhoPagina: number;
  from: number;
  to: number;
}

export function resolvePagination(filters: {
  pagina?: number;
  tamanhoPagina?: number;
}): ResolvedPagination | null {
  if (filters.pagina === undefined && filters.tamanhoPagina === undefined) return null;

  const tamanhoBruto = filters.tamanhoPagina ?? PAGE_SIZE_DEFAULT;
  const tamanhoPagina = Math.min(PAGE_SIZE_MAX, Math.max(1, Math.floor(tamanhoBruto)));
  const pagina = Math.max(1, Math.floor(filters.pagina ?? 1));
  const from = (pagina - 1) * tamanhoPagina;
  const to = from + tamanhoPagina - 1;
  return { pagina, tamanhoPagina, from, to };
}
