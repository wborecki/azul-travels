import { CategoryPills } from "@/components/explorar/CategoryPills";
import { FiltrosRapidos } from "@/components/explorar/FiltrosRapidos";
import { LinhaRolavel } from "@/components/explorar/LinhaRolavel";
import type { EstabTipo } from "@/lib/enums";
import type { ExplorarSearch } from "@/lib/explorar-search";

interface BarraFiltrosProps {
  search: ExplorarSearch;
  tipoAtivo?: EstabTipo;
  onSelectTipo: (tipo?: EstabTipo) => void;
  onPatch: (patch: Partial<ExplorarSearch>) => void;
  onSalvarPadrao?: () => void;
  salvandoPadrao?: boolean;
}

export function BarraFiltros({
  search,
  tipoAtivo,
  onSelectTipo,
  onPatch,
  onSalvarPadrao,
  salvandoPadrao,
}: BarraFiltrosProps) {
  return (
    <div className="sticky top-20 z-30 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container mx-auto px-4">
        <LinhaRolavel rotulo="Categorias" className="pt-2.5">
          <CategoryPills tipoAtivo={tipoAtivo} onSelect={onSelectTipo} />
        </LinhaRolavel>

        <LinhaRolavel rotulo="Filtros" className="py-2.5">
          <FiltrosRapidos
            search={search}
            onPatch={onPatch}
            onSalvarPadrao={onSalvarPadrao}
            salvandoPadrao={salvandoPadrao}
          />
        </LinhaRolavel>
      </div>
    </div>
  );
}
