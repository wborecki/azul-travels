import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExplorarPaginationProps {
  pagina: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
}

/**
 * Janela de páginas com reticências: sempre mostra a primeira, a última
 * e a vizinhança da atual (ex.: 1 … 4 [5] 6 … 12).
 */
function janelaDePaginas(pagina: number, totalPaginas: number): Array<number | "…"> {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }
  const vizinhas = new Set([1, totalPaginas, pagina - 1, pagina, pagina + 1]);
  const paginas: Array<number | "…"> = [];
  for (let p = 1; p <= totalPaginas; p++) {
    if (vizinhas.has(p)) {
      paginas.push(p);
    } else if (paginas[paginas.length - 1] !== "…") {
      paginas.push("…");
    }
  }
  return paginas;
}

export function ExplorarPagination({ pagina, totalPaginas, onChange }: ExplorarPaginationProps) {
  if (totalPaginas <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Paginação de resultados">
      <Button
        variant="outline"
        size="sm"
        disabled={pagina <= 1}
        onClick={() => onChange(pagina - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      {janelaDePaginas(pagina, totalPaginas).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground select-none">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === pagina ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(p)}
            aria-current={p === pagina ? "page" : undefined}
            aria-label={`Página ${p}`}
            className="min-w-9"
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={pagina >= totalPaginas}
        onClick={() => onChange(pagina + 1)}
        aria-label="Próxima página"
      >
        <span className="hidden sm:inline">Próximo</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
