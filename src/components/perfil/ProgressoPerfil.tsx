import { CheckCircle2 } from "lucide-react";
import { LIMIAR_UTIL } from "@/lib/perfil/blocos";

/**
 * Progresso do perfil.
 *
 * O alvo não é 100%: acima de `LIMIAR_UTIL` o estabelecimento já consegue se
 * preparar, e é isso que a frase diz. Perfil completo esconde o painel - quem já
 * terminou não precisa continuar vendo uma barra.
 */
export function ProgressoPerfil({
  pct,
  nome,
  blocosCompletos,
  blocosTotal,
}: {
  pct: number;
  nome: string;
  blocosCompletos: number;
  blocosTotal: number;
}) {
  if (pct >= 100) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-bold text-emerald-800 text-sm">
            Perfil de {nome} completo
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Você pode voltar aqui e ajustar sempre que algo mudar.
          </p>
        </div>
      </div>
    );
  }

  const util = pct >= LIMIAR_UTIL;

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-display font-bold text-primary">
            {blocosCompletos} de {blocosTotal} blocos prontos
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {util
              ? "Já dá para o hotel se preparar. Cada bloco a mais deixa a chegada mais tranquila."
              : `A partir de ${LIMIAR_UTIL}% o hotel já consegue se preparar para receber ${nome}.`}
          </p>
        </div>
        <p className="text-3xl font-display font-bold text-secondary leading-none shrink-0">
          {pct}%
        </p>
      </div>
      <div
        className="h-2 w-full bg-azul-claro rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Perfil de ${nome} ${pct}% preenchido`}
      >
        <div
          className="h-full bg-secondary transition-all duration-500 ease-out"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}
