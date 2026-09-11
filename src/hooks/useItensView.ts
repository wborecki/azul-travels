import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchItensViewMapa,
  fetchItensViewPaginated,
  fetchItensViewTotal,
  type ItensViewFilters,
} from "@/lib/queries";

const RAIZ = "itens-view";

export function useItensViewPagina(filtros: ItensViewFilters) {
  return useQuery({
    queryKey: [RAIZ, "pagina", filtros],
    queryFn: () => fetchItensViewPaginated(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useItensViewMapa(filtros: ItensViewFilters, ativo: boolean) {
  return useQuery({
    queryKey: [RAIZ, "mapa", filtros],
    queryFn: () => fetchItensViewMapa(filtros),
    enabled: ativo,
    placeholderData: keepPreviousData,
  });
}

export function useItensViewTotal(filtros: ItensViewFilters, ativo: boolean) {
  const semPaginacao: ItensViewFilters = {
    ...filtros,
    pagina: undefined,
    tamanhoPagina: undefined,
    ordenacao: undefined,
  };
  return useQuery({
    queryKey: [RAIZ, "total", semPaginacao],
    queryFn: () => fetchItensViewTotal(semPaginacao),
    enabled: ativo,
    placeholderData: keepPreviousData,
  });
}
