import { Link } from "@tanstack/react-router";
import { ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Bloco, StatusBloco } from "@/lib/perfil/tipos";

/**
 * Card de bloco no hub. Mostra contagem absoluta ("7 de 12 respondidas") em vez
 * de percentual: é mais informativo e não pune quem deixou opcionais em branco.
 */
export function CardBloco({
  bloco,
  status,
  perfilId,
  destaque,
}: {
  bloco: Bloco;
  status: StatusBloco;
  perfilId: string;
  destaque?: boolean;
}) {
  const { Icon } = bloco;

  return (
    <Link
      to="/minha-conta/perfil/$perfilId/$bloco"
      params={{ perfilId, bloco: bloco.id }}
      className={cn(
        "group rounded-2xl border-2 bg-white p-4 flex items-start gap-3 transition",
        destaque
          ? "border-secondary shadow-sm"
          : status.completo
            ? "border-emerald-200 hover:border-emerald-300"
            : "border-border hover:border-secondary/50",
      )}
    >
      <span
        className={cn(
          "shrink-0 h-10 w-10 rounded-xl grid place-items-center",
          status.completo
            ? "bg-emerald-50 text-emerald-600"
            : destaque
              ? "bg-secondary text-white"
              : "bg-azul-claro text-secondary",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={cn(
              "font-display font-bold text-primary",
              status.completo && "line-through decoration-emerald-500/60 text-muted-foreground",
            )}
          >
            {bloco.titulo}
          </h3>
          {destaque && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Próximo
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-0.5">{bloco.porque}</p>

        <div className="flex items-center gap-3 mt-2 text-xs">
          <span
            className={cn(
              "font-medium",
              status.completo ? "text-emerald-700" : "text-muted-foreground",
            )}
          >
            {status.completo
              ? "Pronto"
              : status.iniciado
                ? `${status.respondidas} de ${status.total} respondidas`
                : `${status.total} perguntas`}
          </span>
          {!status.completo && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> ~{bloco.minutos} min
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-3 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
