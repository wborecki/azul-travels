import { Minus, Plus } from "lucide-react";

interface ContadorHospedesProps {
  label: string;
  sublabel: string;
  valor: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

/**
 * Linha de contador (- N +) de uma categoria de hóspedes. Usada no painel de
 * hóspedes do card de reserva (`/quartos/$id`) e no filtro de hóspedes do
 * `/explorar`.
 */
export function ContadorHospedes({
  label,
  sublabel,
  valor,
  min,
  max,
  onChange,
}: ContadorHospedesProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, valor - 1))}
          disabled={valor <= min}
          className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground transition disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary"
          aria-label={`Diminuir ${label.toLowerCase()}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-sm tabular-nums">{valor}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, valor + 1))}
          disabled={valor >= max}
          className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground transition disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary"
          aria-label={`Aumentar ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
