import { Waves } from "lucide-react";
import { useModoCalmo } from "@/hooks/useModoCalmo";
import { cn } from "@/lib/utils";

const DESCRICAO = "Modo calmo: reduz animações e a intensidade das cores";

interface BotaoModoCalmoProps {
  variante?: "icone" | "linha";
  onAlternar?: () => void;
}

export function BotaoModoCalmo({ variante = "icone", onAlternar }: BotaoModoCalmoProps) {
  const { ativo, alternar } = useModoCalmo();

  function acionar() {
    alternar();
    onAlternar?.();
  }

  if (variante === "linha") {
    return (
      <button
        type="button"
        onClick={acionar}
        aria-pressed={ativo}
        title={DESCRICAO}
        className={cn(
          "mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-base font-semibold transition",
          ativo
            ? "bg-secondary text-secondary-foreground"
            : "bg-secondary/20 text-white hover:bg-secondary/30",
        )}
      >
        <span className="flex items-center gap-2.5">
          <Waves className="h-4 w-4" aria-hidden /> Modo calmo
        </span>
        <span className="text-xs font-bold uppercase tracking-wide">
          {ativo ? "Ativo" : "Desligado"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={acionar}
      aria-pressed={ativo}
      aria-label={DESCRICAO}
      title={DESCRICAO}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition",
        ativo
          ? "bg-secondary text-secondary-foreground"
          : "bg-secondary/20 text-white hover:bg-secondary/30",
      )}
    >
      <Waves className="h-5 w-5" aria-hidden />
    </button>
  );
}
