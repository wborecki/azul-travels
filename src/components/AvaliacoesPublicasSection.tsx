/**
 * Seção tipada de avaliações públicas — usada na página de detalhe do
 * estabelecimento (e reutilizável onde mais fizer sentido).
 *
 * Responsabilidades:
 *  - Consumir `useAvaliacoesPublicasPorEstab` (encapsula loading/error/data).
 *  - Renderizar de forma **exaustiva** cada estado possível:
 *      1. loading       → skeleton acessível
 *      2. error         → toast + bloco de erro com botão "Tentar de novo"
 *      3. empty (sem dados) → mensagem amigável
 *      4. data          → lista das avaliações
 *  - Manter o **type contract** intacto: `AvaliacaoComFamilia[]` chega na
 *    UI sem cast/coerção. `nome_responsavel` continua `string | null` —
 *    fallback para "Família" quando vazio.
 *
 * Por que componente próprio?
 *  - Isola o ciclo loading/error da página gigante de detalhe (~460
 *    linhas). Page só precisa renderizar `<AvaliacoesPublicasSection
 *    estabelecimentoId={e.id} />`.
 *  - Cobre o requisito "tratar erro e loading de forma tipada" num só
 *    lugar — qualquer outra rota que liste avaliações ganha o mesmo
 *    tratamento gratuitamente.
 */

import { useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvaliacoesPublicasPorEstab } from "@/hooks/useAvaliacoesPublicasPorEstab";
import type { AvaliacaoComFamilia } from "@/lib/queries/avaliacoes";
import { formatDateBR } from "@/lib/brazil";

interface AvaliacoesPublicasSectionProps {
  /** ID do estabelecimento — `null`/`undefined` deixa o hook em "pause". */
  estabelecimentoId: string | null | undefined;
  /** Cabeçalho opcional. Default: "Avaliações de famílias TEA". */
  titulo?: string;
}

export function AvaliacoesPublicasSection({
  estabelecimentoId,
  titulo = "Avaliações de famílias TEA",
}: AvaliacoesPublicasSectionProps) {
  const { data, loading, error, refetch } = useAvaliacoesPublicasPorEstab(estabelecimentoId);

  // Toast leve só quando aparecer um erro novo — evita spam em refetch.
  useEffect(() => {
    if (!error) return;
    toast.error("Não foi possível carregar as avaliações", {
      description: error.message,
    });
  }, [error]);

  return (
    <section aria-labelledby="avaliacoes-titulo">
      <h3 id="avaliacoes-titulo" className="font-display font-bold text-lg text-primary mb-4">
        {titulo}
      </h3>

      {loading ? (
        <AvaliacoesSkeleton />
      ) : error ? (
        <AvaliacoesErrorBlock message={error.message} onRetry={refetch} />
      ) : data.length === 0 ? (
        <AvaliacoesEmpty />
      ) : (
        <AvaliacoesLista avaliacoes={data} />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponentes — separados por estado para legibilidade e reuso.
// ─────────────────────────────────────────────────────────────────────────────

function AvaliacoesSkeleton() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando avaliações"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function AvaliacoesErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-center space-y-3"
    >
      <div>
        <p className="text-sm font-medium text-destructive">
          Não foi possível carregar as avaliações
        </p>
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}

function AvaliacoesEmpty() {
  return (
    <div className="bg-muted/40 rounded-xl p-6 text-center text-sm text-muted-foreground">
      Ainda não há avaliações para este estabelecimento.
    </div>
  );
}

function AvaliacoesLista({ avaliacoes }: { avaliacoes: AvaliacaoComFamilia[] }) {
  return (
    <div className="space-y-3">
      {avaliacoes.map((a) => (
        <AvaliacaoCard key={a.id} avaliacao={a} />
      ))}
    </div>
  );
}

function AvaliacaoCard({ avaliacao }: { avaliacao: AvaliacaoComFamilia }) {
  // `nome_responsavel` é `string | null` por contrato — fallback explícito.
  const nomeCompleto = avaliacao.familia_profiles?.nome_responsavel ?? null;
  const primeiroNome = nomeCompleto?.split(" ")[0] ?? "Família";
  const nota = avaliacao.nota_geral ?? 0;

  return (
    <article className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{primeiroNome}</p>
        <div
          className="flex items-center gap-1 text-amarelo"
          aria-label={`Nota: ${nota} de 5`}
        >
          {Array.from({ length: nota }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{formatDateBR(avaliacao.criado_em)}</p>
      {avaliacao.comentario && <p className="mt-2 text-sm">{avaliacao.comentario}</p>}
    </article>
  );
}
