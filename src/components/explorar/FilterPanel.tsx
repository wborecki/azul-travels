import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SELO_BADGES, RECURSO_BADGES } from "@/components/Badges";
import { ESTADOS_BR } from "@/lib/brazil";
import type { ItemRecursoFlag, ItemSeloFlag } from "@/lib/queries";
import {
  ITEM_RECURSO_FLAGS,
  ITEM_SELO_FLAGS,
  csvOrUndefined,
  parseRecursosCsv,
  parseSelosCsv,
  type ExplorarSearch,
} from "@/lib/explorar-search";

interface FilterPanelProps {
  /** Filtros aplicados (URL) - o rascunho local ressincroniza quando mudam. */
  aplicados: ExplorarSearch;
  /** Recebe o patch de search params do painel (valores `undefined` limpam). */
  onAplicar: (patch: Partial<ExplorarSearch>) => void;
  /** Salva tipos/selos/recursos atuais como padrão do usuário (só logado). */
  onSalvarPadrao?: () => void;
  salvandoPadrao?: boolean;
}

function numeroOuUndefined(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function toggle<T>(set: ReadonlySet<T>, valor: T): Set<T> {
  const novo = new Set(set);
  if (novo.has(valor)) novo.delete(valor);
  else novo.add(valor);
  return novo;
}

/**
 * Painel de filtros do `/explorar`: localização, selos, recursos TEA,
 * faixa de preço e capacidade mínima. Mantém rascunho local - nada muda
 * na URL até "Aplicar filtros". Usado inline no desktop e dentro de um
 * Sheet no mobile (duas instâncias independentes, ambas sincronizadas
 * com os valores aplicados na URL).
 */
export function FilterPanel({
  aplicados,
  onAplicar,
  onSalvarPadrao,
  salvandoPadrao,
}: FilterPanelProps) {
  const [estado, setEstado] = useState(aplicados.estado ?? "");
  const [selos, setSelos] = useState<Set<ItemSeloFlag>>(
    () => new Set(parseSelosCsv(aplicados.selos)),
  );
  const [recursos, setRecursos] = useState<Set<ItemRecursoFlag>>(
    () => new Set(parseRecursosCsv(aplicados.recursos)),
  );
  const [precoMin, setPrecoMin] = useState(aplicados.preco_min?.toString() ?? "");
  const [precoMax, setPrecoMax] = useState(aplicados.preco_max?.toString() ?? "");
  const [capacidadeMin, setCapacidadeMin] = useState(aplicados.capacidade_min?.toString() ?? "");

  // URL mudou por fora (back/forward, pills, limpar) - descarta o rascunho.
  useEffect(() => {
    setEstado(aplicados.estado ?? "");
    setSelos(new Set(parseSelosCsv(aplicados.selos)));
    setRecursos(new Set(parseRecursosCsv(aplicados.recursos)));
    setPrecoMin(aplicados.preco_min?.toString() ?? "");
    setPrecoMax(aplicados.preco_max?.toString() ?? "");
    setCapacidadeMin(aplicados.capacidade_min?.toString() ?? "");
  }, [aplicados]);

  function aplicar() {
    onAplicar({
      estado: estado || undefined,
      selos: csvOrUndefined([...selos]),
      recursos: csvOrUndefined([...recursos]),
      preco_min: numeroOuUndefined(precoMin),
      preco_max: numeroOuUndefined(precoMax),
      capacidade_min: numeroOuUndefined(capacidadeMin),
    });
  }

  function limpar() {
    onAplicar({
      estado: undefined,
      cidade: undefined,
      selos: undefined,
      recursos: undefined,
      preco_min: undefined,
      preco_max: undefined,
      capacidade_min: undefined,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Estado</h3>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="mt-2 w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos</option>
          {ESTADOS_BR.map((uf) => (
            <option key={uf.sigla} value={uf.sigla}>
              {uf.nome}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Selos</h3>
        <div className="mt-2 flex flex-col gap-2">
          {ITEM_SELO_FLAGS.map((flag) => (
            <label
              key={flag}
              className="flex items-center gap-2 text-sm cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selos.has(flag)}
                onChange={() => setSelos((s) => toggle(s, flag))}
                className="h-4 w-4 accent-primary"
              />
              {SELO_BADGES[flag].label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Recursos TEA</h3>
        <div className="mt-2 flex flex-col gap-2">
          {ITEM_RECURSO_FLAGS.map((flag) => (
            <label
              key={flag}
              className="flex items-center gap-2 text-sm cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={recursos.has(flag)}
                onChange={() => setRecursos((r) => toggle(r, flag))}
                className="h-4 w-4 accent-primary"
              />
              {RECURSO_BADGES[flag].label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
          Preço por noite (R$)
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Mínimo"
            value={precoMin}
            onChange={(e) => setPrecoMin(e.target.value)}
            aria-label="Preço mínimo"
          />
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Máximo"
            value={precoMax}
            onChange={(e) => setPrecoMax(e.target.value)}
            aria-label="Preço máximo"
          />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Hóspedes</h3>
        <Input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Capacidade mínima"
          value={capacidadeMin}
          onChange={(e) => setCapacidadeMin(e.target.value)}
          className="mt-2"
          aria-label="Capacidade mínima de hóspedes"
        />
      </section>

      <div className="flex gap-2 pt-1">
        <Button onClick={aplicar} className="flex-1">
          Aplicar filtros
        </Button>
        <Button variant="outline" onClick={limpar}>
          Limpar
        </Button>
      </div>

      {onSalvarPadrao && (
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSalvarPadrao}
            disabled={salvandoPadrao}
            className="w-full justify-start text-muted-foreground"
          >
            {salvandoPadrao ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar como meu filtro padrão
          </Button>
          <p className="mt-1 px-3 text-[11px] text-muted-foreground">
            Tipos, selos e recursos aplicados serão reaplicados na sua próxima visita.
          </p>
        </div>
      )}
    </div>
  );
}
