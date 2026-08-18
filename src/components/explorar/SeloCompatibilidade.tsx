import { RECURSO_BADGES } from "@/components/Badges";
import { nivelCompatibilidade, type Compatibilidade } from "@/lib/perfil/compatibilidade";
import { cn } from "@/lib/utils";

/** Texto do `title`: sempre diz o que falta, não só o número. */
function resumo(compat: Compatibilidade, nomes: string): string {
  const base = `${compat.atendidas.length} de ${compat.total} necessidades de ${nomes}`;
  if (compat.faltando.length === 0) return `${base} — atende tudo`;
  return `${base}. Falta: ${compat.faltando.map((f) => RECURSO_BADGES[f].label).join(", ")}`;
}

/** Pill sobre a foto do card. Curta de propósito: o detalhe vai no corpo. */
export function SeloCompatibilidade({ compat, nomes }: { compat: Compatibilidade; nomes: string }) {
  const nivel = nivelCompatibilidade(compat.pct);
  return (
    <span
      title={resumo(compat, nomes)}
      className={cn(
        "absolute left-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-md",
        nivel.fundo,
        nivel.texto,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", nivel.barra)} aria-hidden />
      {compat.pct}% compatível
      <span className="sr-only"> com o perfil de {nomes}</span>
    </span>
  );
}

/**
 * Linha no corpo do card. Nomear o que falta é o que torna o percentual
 * acionável - "83%" sozinho não diz à família o que ela vai encontrar lá.
 */
export function DetalheCompatibilidade({
  compat,
  className,
}: {
  compat: Compatibilidade;
  className?: string;
}) {
  if (compat.faltando.length === 0) {
    return (
      <p className={cn("text-xs font-medium text-emerald-700", className)}>
        Atende tudo que o perfil precisa
      </p>
    );
  }
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <span className="font-medium text-foreground/80">Não tem:</span>{" "}
      {compat.faltando.map((f) => RECURSO_BADGES[f].label).join(" · ")}
    </p>
  );
}
