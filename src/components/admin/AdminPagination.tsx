import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Opções padrão de itens por página para listagens admin. */
export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type AdminPageSize = (typeof ADMIN_PAGE_SIZE_OPTIONS)[number];

interface AdminPaginationProps {
  /** Página atual (1-indexada). */
  pagina: number;
  /** Tamanho da página atual. */
  tamanhoPagina: number;
  /** Total de páginas (sempre ≥ 1). */
  totalPaginas: number;
  /** Total de itens (para o contador). */
  total: number;
  onPaginaChange: (pagina: number) => void;
  onTamanhoChange: (tamanho: number) => void;
  /** Quando true, desabilita controles enquanto a tabela recarrega. */
  loading?: boolean;
  /** Texto singular/plural do item paginado (ex: "reserva(s)"). */
  itemLabel?: string;
}

/**
 * Rodapé padronizado de paginação para tabelas admin.
 * Combina seletor de itens-por-página + navegação prev/next + indicador de página.
 */
export function AdminPagination({
  pagina,
  tamanhoPagina,
  totalPaginas,
  total,
  onPaginaChange,
  onTamanhoChange,
  loading,
  itemLabel = "registro(s)",
}: AdminPaginationProps) {
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanhoPagina + 1;
  const fim = Math.min(total, pagina * tamanhoPagina);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Itens por página:</span>
        <Select
          value={String(tamanhoPagina)}
          onValueChange={(v) => onTamanhoChange(Number(v))}
          disabled={loading}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADMIN_PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-muted-foreground">
        {total === 0 ? (
          <>Nenhum {itemLabel}</>
        ) : (
          <>
            <strong className="text-foreground">
              {inicio}-{fim}
            </strong>{" "}
            de <strong className="text-foreground">{total}</strong> {itemLabel}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
          disabled={loading || pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-muted-foreground tabular-nums">
          Página <strong className="text-foreground">{pagina}</strong> de{" "}
          <strong className="text-foreground">{totalPaginas}</strong>
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={() => onPaginaChange(Math.min(totalPaginas, pagina + 1))}
          disabled={loading || pagina >= totalPaginas}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
