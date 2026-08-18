import { CategoryPills } from "@/components/explorar/CategoryPills";
import { FiltrosRapidos } from "@/components/explorar/FiltrosRapidos";
import { LinhaRolavel } from "@/components/explorar/LinhaRolavel";
import type { EstabTipo } from "@/lib/enums";
import type { ExplorarSearch } from "@/lib/explorar-search";
import type { ItemRecursoFlag } from "@/lib/queries";
import type { PerfilNecessidades } from "@/lib/perfil/compatibilidade";

interface BarraFiltrosProps {
  search: ExplorarSearch;
  tipoAtivo?: EstabTipo;
  onSelectTipo: (tipo?: EstabTipo) => void;
  onPatch: (patch: Partial<ExplorarSearch>) => void;
  onSalvarPadrao?: () => void;
  salvandoPadrao?: boolean;
  perfisDisponiveis: ReadonlyArray<PerfilNecessidades>;
  perfisSelecionados: ReadonlyArray<PerfilNecessidades>;
  necessidades: ReadonlyArray<ItemRecursoFlag>;
  carregandoPerfis: boolean;
}

export function BarraFiltros({
  search,
  tipoAtivo,
  onSelectTipo,
  onPatch,
  onSalvarPadrao,
  salvandoPadrao,
  perfisDisponiveis,
  perfisSelecionados,
  necessidades,
  carregandoPerfis,
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
            perfisDisponiveis={perfisDisponiveis}
            perfisSelecionados={perfisSelecionados}
            necessidades={necessidades}
            carregandoPerfis={carregandoPerfis}
          />
        </LinhaRolavel>
      </div>
    </div>
  );
}
