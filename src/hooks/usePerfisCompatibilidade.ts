import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchPerfisComNecessidades } from "@/lib/queries";
import { necessidadesDosPerfis, type PerfilNecessidades } from "@/lib/perfil/compatibilidade";
import { parsePerfisCsv, type ExplorarSearch } from "@/lib/explorar-search";

export interface PerfisCompatibilidade {
  /** Todos os perfis da família - as opções do filtro. */
  disponiveis: PerfilNecessidades[];
  /** Os que estão marcados na URL. */
  selecionados: PerfilNecessidades[];
  /** União das necessidades dos selecionados, já como flags da oferta. */
  necessidades: ReturnType<typeof necessidadesDosPerfis>;
  carregando: boolean;
}

/**
 * Resolve os ids de perfil da URL em necessidades concretas.
 *
 * Ids que não pertencem à família simplesmente não aparecem: a RLS não os
 * devolve, e o filtro passa a valer só para os que restarem.
 */
export function usePerfisCompatibilidade(search: ExplorarSearch): PerfisCompatibilidade {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["perfis-necessidades", user?.id],
    queryFn: () => fetchPerfisComNecessidades(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const disponiveis = useMemo(() => data ?? [], [data]);

  const selecionados = useMemo(() => {
    const ids = new Set(parsePerfisCsv(search.perfis));
    return disponiveis.filter((p) => ids.has(p.id));
  }, [disponiveis, search.perfis]);

  const necessidades = useMemo(() => necessidadesDosPerfis(selecionados), [selecionados]);

  return {
    disponiveis,
    selecionados,
    necessidades,
    carregando: !!user && isLoading,
  };
}
