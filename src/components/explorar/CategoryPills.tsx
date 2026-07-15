import type { EstabTipo } from "@/lib/enums";

/**
 * Pills de categoria do `/explorar` - mesmo conjunto (ícones/labels) da
 * versão anterior da página, com Resorts incluído. Seleção única: clicar
 * numa pill define `tipos` na URL com aquele tipo; "Tudo" limpa.
 */
const PILLS: ReadonlyArray<{ tipo?: EstabTipo; label: string; icon: string }> = [
  { label: "Tudo", icon: "✨" },
  { tipo: "hotel", label: "Hotéis", icon: "🏨" },
  { tipo: "pousada", label: "Pousadas", icon: "🏡" },
  { tipo: "resort", label: "Resorts", icon: "🌴" },
  { tipo: "restaurante", label: "Restaurantes", icon: "🍽️" },
  { tipo: "parque", label: "Parques", icon: "🎢" },
  { tipo: "passeio_educativo", label: "Passeios Educativos", icon: "🎒" },
];

interface CategoryPillsProps {
  /** Tipo único ativo (quando `tipos` na URL tem exatamente um valor). */
  tipoAtivo?: EstabTipo;
  onSelect: (tipo?: EstabTipo) => void;
}

export function CategoryPills({ tipoAtivo, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PILLS.map((p) => {
        const ativo = p.tipo === tipoAtivo;
        return (
          <button
            key={p.tipo ?? "tudo"}
            type="button"
            aria-pressed={ativo}
            onClick={() => onSelect(p.tipo)}
            className={
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition " +
              (ativo
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-white text-foreground/80 border-border hover:border-primary/40 hover:text-primary")
            }
          >
            <span aria-hidden>{p.icon}</span>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
