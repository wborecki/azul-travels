import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryPills } from "@/components/explorar/CategoryPills";
import { FilterPanel } from "@/components/explorar/FilterPanel";
import type { EstabTipo } from "@/lib/enums";
import type { ExplorarSearch } from "@/lib/explorar-search";

interface FiltrosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aplicados: ExplorarSearch;
  tipoAtivo?: EstabTipo;
  onSelectTipo: (tipo?: EstabTipo) => void;
  onAplicar: (patch: Partial<ExplorarSearch>) => void;
  onSalvarPadrao?: () => void;
  salvandoPadrao?: boolean;
}

/** Modal único de filtros: tipo de acomodação + todos os campos do FilterPanel. */
export function FiltrosModal({
  open,
  onOpenChange,
  aplicados,
  tipoAtivo,
  onSelectTipo,
  onAplicar,
  onSalvarPadrao,
  salvandoPadrao,
}: FiltrosModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
              Tipo de acomodação
            </h3>
            <div className="mt-2">
              <CategoryPills tipoAtivo={tipoAtivo} onSelect={onSelectTipo} />
            </div>
          </section>

          <FilterPanel
            aplicados={aplicados}
            onAplicar={(patch) => {
              onAplicar(patch);
              onOpenChange(false);
            }}
            onSalvarPadrao={onSalvarPadrao}
            salvandoPadrao={salvandoPadrao}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
