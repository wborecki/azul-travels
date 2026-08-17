import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ContadorHospedes } from "@/components/ContadorHospedes";
import type { HospedesQuarto } from "@/hooks/useHospedesQuarto";
import { cn } from "@/lib/utils";

export function SeletorHospedes({ hospedes }: { hospedes: HospedesQuarto }) {
  const { adultos, criancas, capacidadeTotal, maxAdultos, maxCriancas, definirHospedes } =
    hospedes;

  return (
    <div className="space-y-4">
      <ContadorHospedes
        label="Adultos"
        sublabel="13 anos ou mais"
        valor={adultos}
        min={1}
        max={Math.max(1, Math.min(maxAdultos, capacidadeTotal - criancas))}
        onChange={(v) => definirHospedes(v, criancas)}
      />
      <ContadorHospedes
        label="Crianças"
        sublabel="De 2 a 12 anos"
        valor={criancas}
        min={0}
        max={Math.max(0, Math.min(maxCriancas, capacidadeTotal - adultos))}
        onChange={(v) => definirHospedes(adultos, v)}
      />
      <p className="text-xs text-muted-foreground">
        Este espaço acomoda no máximo {capacidadeTotal} hóspede(s).
      </p>
    </div>
  );
}

export function HospedesColapsavel({
  hospedes,
  className,
}: {
  hospedes: HospedesQuarto;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const { total } = hospedes;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-3 text-left"
        aria-expanded={aberto}
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Hóspedes
          </div>
          <div className="text-sm text-foreground">
            {total} {total === 1 ? "hóspede" : "hóspedes"}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary">
          {aberto ? "Pronto" : "Alterar"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", aberto && "rotate-180")} />
        </span>
      </button>

      {aberto && (
        <div className="pb-4">
          <SeletorHospedes hospedes={hospedes} />
        </div>
      )}
    </div>
  );
}
