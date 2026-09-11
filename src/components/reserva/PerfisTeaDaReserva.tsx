import type { PerfilDaReserva } from "@/lib/queries";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Visualizações compartilhadas dos perfis TEA vinculados a uma reserva:
 * avatares empilhados (cards/listagens) e lista detalhada (sidebars).
 * Aceita qualquer shape que contenha os campos de `PerfilDaReserva`
 * (a row completa de `perfil_sensorial` também serve).
 */

function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase() || "?";
}

function FotoPerfil({ perfil, className }: { perfil: PerfilDaReserva; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full overflow-hidden bg-azul-claro grid place-items-center shrink-0",
        className,
      )}
    >
      {perfil.foto_url ? (
        <img
          src={perfil.foto_url}
          alt={`Foto de ${perfil.nome_autista}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-display font-bold text-primary text-xs">
          {inicial(perfil.nome_autista)}
        </span>
      )}
    </span>
  );
}

/** Avatares empilhados; o nome do perfil aparece ao passar o mouse. */
export function PerfisTeaAvatares({
  perfis,
  className,
}: {
  perfis: PerfilDaReserva[];
  className?: string;
}) {
  if (perfis.length === 0) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex items-center -space-x-2", className)}>
        {perfis.map((p) => (
          <Tooltip key={p.id}>
            <TooltipTrigger asChild>
              <span className="inline-flex rounded-full">
                <FotoPerfil perfil={p} className="h-8 w-8 border-2 border-white" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {p.nome_autista}
              {p.idade ? ` · ${p.idade} anos` : ""}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

/** Lista detalhada (foto, nome, idade e nível) para sidebars/painéis. */
export function PerfisTeaLista({
  perfis,
  className,
}: {
  perfis: PerfilDaReserva[];
  className?: string;
}) {
  if (perfis.length === 0) return null;
  return (
    <ul className={cn("space-y-2", className)}>
      {perfis.map((p) => (
        <li key={p.id} className="flex items-center gap-2.5">
          <FotoPerfil perfil={p} className="h-9 w-9 border border-primary/20" />
          <div className="text-sm min-w-0">
            <span className="font-semibold text-primary">{p.nome_autista}</span>
            <span className="text-foreground/70">
              {p.idade ? ` · ${p.idade} anos` : ""}
              {p.nivel_tea ? ` · Nível ${p.nivel_tea}` : ""}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
