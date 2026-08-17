import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueletos das telas de Perfil TEA.
 *
 * Cada um imita a silhueta real da tela que substitui, para o conteúdo não
 * "pular" quando chega - é o oposto de um spinner centralizado, que não diz
 * nada sobre o que está por vir.
 */

export function SkeletonListaPerfis() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando perfis">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-2/3 max-w-lg" />
      </div>

      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border bg-white p-4 flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-1.5 w-52" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonHubPerfil({ blocos }: { blocos: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando perfil">
      <Skeleton className="h-4 w-24" />

      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
          <Skeleton className="h-8 w-14 shrink-0" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: blocos }, (_, i) => (
          <div key={i} className="rounded-2xl border-2 bg-white p-4 flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonBloco() {
  return (
    <div aria-busy="true" aria-label="Carregando bloco">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-64 mt-1.5" />
      <Skeleton className="h-4 w-full max-w-md mt-2.5" />

      <div className="mt-8 space-y-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-11 w-24 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonRevisao() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando resumo">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />

      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border bg-white p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          {[0, 1, 2].map((j) => (
            <div key={j} className="grid sm:grid-cols-[1fr_1.2fr] gap-x-4 gap-y-1">
              <Skeleton className="h-4 w-full max-w-56" />
              <Skeleton className="h-4 w-full max-w-40" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
