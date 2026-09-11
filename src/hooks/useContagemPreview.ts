import { useMemo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useItensViewTotal } from "@/hooks/useItensView";
import { searchToFilters, type ExplorarSearch } from "@/lib/explorar-search";
import type { ItemRecursoFlag, ItensViewFilters } from "@/lib/queries";

export interface ContagemPreview {
  total: number | null;
  carregando: boolean;
}

export function useContagemPreview(
  previsto: ExplorarSearch,
  ativo: boolean,
  necessidades: ReadonlyArray<ItemRecursoFlag> = [],
): ContagemPreview {
  const chave = JSON.stringify(searchToFilters(previsto, necessidades));
  const filtros = useMemo(() => JSON.parse(chave) as ItensViewFilters, [chave]);
  const adiado = useDebouncedValue(filtros, 300);

  const { data, isFetching } = useItensViewTotal(adiado, ativo);

  return { total: data ?? null, carregando: ativo && isFetching };
}
