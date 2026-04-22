/**
 * Hook tipado para `fetchAvaliacoesPublicasPorEstab`.
 *
 * Centraliza o ciclo `useEffect` + `useState` que a página de detalhe
 * teria que escrever à mão e devolve um shape `{ data, loading, error,
 * refetch }` reutilizável.
 *
 * Tipagem:
 *  - `data` é inferido **diretamente** do retorno da query
 *    (`AvaliacaoComFamilia[]`) — sem `any`/`unknown`. Os guards em
 *    `core-payloads.guard.ts` e o teste de regressão em
 *    `__tests__/avaliacoes.regression.test.ts` cobrem o contrato.
 *  - `error` é `Error | null`; preservamos a `Error` original do
 *    Supabase quando possível e empacotamos qualquer outra coisa.
 *
 * Por que não TanStack Query?
 *  Este projeto ainda não tem QueryClientProvider configurado e o resto
 *  das páginas usa o padrão `useState + useEffect`. Manter a mesma
 *  forma evita inconsistência. Se um dia adotarmos Query, este hook
 *  é o único ponto de troca — a UI consumidora não muda.
 *
 * Cancelamento:
 *  Cada efeito guarda uma flag `cancelled` para descartar respostas de
 *  requests obsoletos (e.g. `estabelecimentoId` mudou no meio do voo)
 *  — evita "flash" de dados antigos e atualização em componente
 *  desmontado.
 */

import { useCallback, useEffect, useState } from "react";
import {
  fetchAvaliacoesPublicasPorEstab,
  type AvaliacaoComFamilia,
} from "@/lib/queries/avaliacoes";

export interface UseAvaliacoesPublicasResult {
  /** Avaliações públicas do estabelecimento (sempre array — nunca null). */
  data: AvaliacaoComFamilia[];
  /** `true` enquanto a primeira carga (ou um refetch) está em andamento. */
  loading: boolean;
  /** Último erro propagado pela query, ou `null` se a última carga foi OK. */
  error: Error | null;
  /** Reexecuta a query (mantém o mesmo `estabelecimentoId`). */
  refetch: () => void;
}

/**
 * Carrega avaliações públicas de um estabelecimento.
 *
 * Passa `null`/`undefined` em `estabelecimentoId` para "pausar" o hook
 * (útil enquanto o estabelecimento ainda está carregando). Nesse modo,
 * `data` fica `[]`, `loading` fica `false` e nenhuma request é disparada.
 */
export function useAvaliacoesPublicasPorEstab(
  estabelecimentoId: string | null | undefined,
): UseAvaliacoesPublicasResult {
  const [data, setData] = useState<AvaliacaoComFamilia[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(estabelecimentoId));
  const [error, setError] = useState<Error | null>(null);
  // Token incrementado a cada `refetch()` — força o efeito a rodar de novo
  // sem precisar mexer nas deps "reais". Evita dependência circular com
  // uma função `load` em `useCallback`.
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    if (!estabelecimentoId) {
      // Modo "pausado" — limpa o estado para não exibir dados de outro
      // estabelecimento que tenha sido carregado antes.
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAvaliacoesPublicasPorEstab(estabelecimentoId)
      .then((rows) => {
        if (cancelled) return;
        setData(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Preserva `Error` originais do Supabase; embrulha o resto.
        setError(
          err instanceof Error
            ? err
            : new Error(typeof err === "string" ? err : "Erro ao carregar avaliações"),
        );
        setData([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [estabelecimentoId, refetchToken]);

  const refetch = useCallback(() => {
    setRefetchToken((n) => n + 1);
  }, []);

  return { data, loading, error, refetch };
}
