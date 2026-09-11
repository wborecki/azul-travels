import {
  Backpack,
  FerrisWheel,
  Home,
  Hotel,
  Sparkles,
  TreePalm,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { chipClasses } from "@/components/explorar/chips";
import type { EstabTipo } from "@/lib/enums";

const PILLS: ReadonlyArray<{ tipo?: EstabTipo; label: string; Icone: LucideIcon }> = [
  { label: "Tudo", Icone: Sparkles },
  { tipo: "hotel", label: "Hotéis", Icone: Hotel },
  { tipo: "pousada", label: "Pousadas", Icone: Home },
  { tipo: "resort", label: "Resorts", Icone: TreePalm },
  { tipo: "restaurante", label: "Restaurantes", Icone: UtensilsCrossed },
  { tipo: "parque", label: "Parques", Icone: FerrisWheel },
  { tipo: "passeio_educativo", label: "Passeios Educativos", Icone: Backpack },
];

interface CategoryPillsProps {
  tipoAtivo?: EstabTipo;
  onSelect: (tipo?: EstabTipo) => void;
}

export function CategoryPills({ tipoAtivo, onSelect }: CategoryPillsProps) {
  return (
    <>
      {PILLS.map(({ tipo, label, Icone }) => {
        const ativo = tipo === tipoAtivo;
        return (
          <button
            key={tipo ?? "tudo"}
            type="button"
            aria-pressed={ativo}
            onClick={() => onSelect(tipo)}
            className={chipClasses(ativo)}
          >
            <Icone className="h-4 w-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </>
  );
}
