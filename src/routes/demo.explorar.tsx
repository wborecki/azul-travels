import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DEMO_ESTABELECIMENTOS,
  DEMO_PERFIL_SENSORIAL,
  TIPO_LABEL,
  type DemoEstabelecimento,
} from "@/data/demo";
import { DemoEstabCard } from "@/components/demo/DemoEstabCard";
import { DemoBreadcrumb } from "@/components/demo/DemoBreadcrumb";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/demo/explorar")({
  component: DemoExplorar,
});

const TIPOS = Object.keys(TIPO_LABEL) as Array<DemoEstabelecimento["tipo"]>;

const SELOS = [
  { key: "selo_azul", label: "Selo Azul" },
  { key: "tem_beneficio_tea", label: "Benefício TEA" },
  { key: "tour_360_url", label: "Tour 360°" },
] as const;

const RECURSOS = [
  { key: "tem_sala_sensorial", label: "Sala sensorial" },
  { key: "tem_concierge_tea", label: "Concierge TEA" },
  { key: "tem_checkin_antecipado", label: "Check-in antecipado" },
  { key: "tem_fila_prioritaria", label: "Fila prioritária" },
  { key: "tem_cardapio_visual", label: "Cardápio visual" },
  { key: "tem_caa", label: "CAA" },
] as const;

function DemoExplorar() {
  const { view } = useSearch({ from: "/demo" });
  const perfil = view === "familia" ? DEMO_PERFIL_SENSORIAL : undefined;

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [estado, setEstado] = useState<string>("");
  const [selos, setSelos] = useState<string[]>([]);
  const [recursos, setRecursos] = useState<string[]>([]);

  const estados = useMemo(
    () => Array.from(new Set(DEMO_ESTABELECIMENTOS.map((e) => e.estado))).sort(),
    [],
  );

  const filtrados = useMemo(() => {
    return DEMO_ESTABELECIMENTOS.filter((e) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (
          !e.nome.toLowerCase().includes(q) &&
          !e.cidade.toLowerCase().includes(q) &&
          !e.estado.toLowerCase().includes(q)
        )
          return false;
      }
      if (tipo && e.tipo !== tipo) return false;
      if (estado && e.estado !== estado) return false;

      for (const s of selos) {
        if (s === "tour_360_url") {
          if (!e.tour_360_url) return false;
        } else if (!e[s as keyof DemoEstabelecimento]) return false;
      }
      for (const r of recursos) {
        if (!e[r as keyof DemoEstabelecimento]) return false;
      }
      return true;
    });
  }, [busca, tipo, estado, selos, recursos]);

  function toggle(arr: string[], setArr: (v: string[]) => void, key: string) {
    setArr(arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]);
  }

  function limpar() {
    setBusca("");
    setTipo("");
    setEstado("");
    setSelos([]);
    setRecursos([]);
  }

  const temFiltros =
    busca || tipo || estado || selos.length > 0 || recursos.length > 0;

  return (
    <div className="min-h-screen bg-azul-claro pb-16">
      <DemoBreadcrumb items={[{ label: "Explorar destinos" }]} />

      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">
          Explorar destinos
        </h1>
        {perfil && (
          <p className="mt-1 text-sm text-muted-foreground">
            Compatibilidade calculada com o perfil do {perfil.nome_autista}.
          </p>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mt-6">
          {/* FILTROS */}
          <aside className="bg-white rounded-2xl border p-5 h-fit lg:sticky lg:top-28 space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Buscar
              </label>
              <div className="mt-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome, cidade, estado..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="">Todos</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="">Todos</option>
                {estados.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Selos
              </label>
              <div className="mt-2 space-y-2">
                {SELOS.map((s) => (
                  <label key={s.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selos.includes(s.key)}
                      onChange={() => toggle(selos, setSelos, s.key)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Recursos
              </label>
              <div className="mt-2 space-y-2">
                {RECURSOS.map((r) => (
                  <label key={r.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={recursos.includes(r.key)}
                      onChange={() => toggle(recursos, setRecursos, r.key)}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {temFiltros && (
              <button
                onClick={limpar}
                className="w-full inline-flex items-center justify-center gap-1 text-sm text-secondary hover:text-primary font-medium pt-2 border-t"
              >
                <X className="h-4 w-4" /> Limpar filtros
              </button>
            )}
          </aside>

          {/* RESULTADOS */}
          <div>
            <div className="text-sm text-muted-foreground mb-4">
              <strong className="text-foreground">{filtrados.length}</strong>{" "}
              destino{filtrados.length === 1 ? "" : "s"} encontrado
              {filtrados.length === 1 ? "" : "s"}
            </div>
            {filtrados.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center text-muted-foreground">
                Nenhum destino corresponde aos filtros selecionados.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {filtrados.map((e) => (
                  <DemoEstabCard key={e.id} estab={e} perfil={perfil} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
