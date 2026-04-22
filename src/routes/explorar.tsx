import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EstabCard } from "@/components/EstabCard";
import {
  fetchEstabelecimentosView,
  type EstabelecimentoView,
  type EstabelecimentosViewFilters,
  type RecursoFlag,
  type SeloFlag,
} from "@/lib/queries";
import { SELO_BADGES, RECURSO_BADGES } from "@/components/Badges";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, SlidersHorizontal, X, Camera, Gift } from "lucide-react";
import { ESTADOS_BR } from "@/lib/brazil";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface Search {
  q?: string;
  tipo?: string;
}

export const Route = createFileRoute("/explorar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    tipo: typeof s.tipo === "string" ? s.tipo : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explorar destinos — Turismo Azul" },
      {
        name: "description",
        content:
          "Encontre hotéis, restaurantes e parques realmente preparados para famílias TEA.",
      },
    ],
  }),
  component: Explorar,
});

type EstabTipo =
  | "hotel"
  | "pousada"
  | "resort"
  | "restaurante"
  | "parque"
  | "atracoes"
  | "agencia"
  | "transporte";

const TIPOS: ReadonlyArray<{ v: EstabTipo; l: string }> = [
  { v: "hotel", l: "Hotel" },
  { v: "pousada", l: "Pousada" },
  { v: "resort", l: "Resort" },
  { v: "restaurante", l: "Restaurante" },
  { v: "parque", l: "Parque" },
  { v: "atracoes", l: "Atrações" },
  { v: "agencia", l: "Agência" },
  { v: "transporte", l: "Transporte" },
];

const SELOS_LIST: ReadonlyArray<SeloFlag> = [
  "selo_azul",
  "selo_governamental",
  "selo_privado",
];

const RECURSOS_LIST: ReadonlyArray<RecursoFlag> = [
  "tem_sala_sensorial",
  "tem_concierge_tea",
  "tem_checkin_antecipado",
  "tem_fila_prioritaria",
  "tem_cardapio_visual",
  "tem_caa",
];

function Explorar() {
  const { q, tipo } = Route.useSearch();
  const { user } = useAuth();

  const [busca, setBusca] = useState(q ?? "");
  const buscaDebounced = useDebouncedValue(busca, 350);

  const [tipos, setTipos] = useState<EstabTipo[]>(
    tipo ? [tipo as EstabTipo] : [],
  );
  const [selos, setSelos] = useState<SeloFlag[]>([]);
  const [recursos, setRecursos] = useState<RecursoFlag[]>([]);
  const [estado, setEstado] = useState<string>("todos");
  const [beneficio, setBeneficio] = useState(false);
  const [tour360, setTour360] = useState(false);
  const [ordem, setOrdem] = useState<"relevante" | "recente" | "certificados">(
    "relevante",
  );
  const [list, setList] = useState<EstabelecimentoView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [perfilNecessidades, setPerfilNecessidades] = useState<
    Record<string, boolean>
  >({});

  // Carrega necessidades do primeiro perfil sensorial da família
  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("perfil_sensorial")
        .select("*")
        .eq("familia_id", user.id)
        .order("criado_em", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        setPerfilNecessidades({
          tem_sala_sensorial: !!data.precisa_sala_sensorial,
          tem_checkin_antecipado: !!data.precisa_checkin_antecipado,
          tem_fila_prioritaria: !!data.precisa_fila_prioritaria,
          tem_cardapio_visual: !!data.precisa_cardapio_visual,
          tem_concierge_tea: !!data.precisa_concierge_tea,
          tem_caa: !!data.usa_caa,
        });
      }
    })();
  }, [user]);

  // Refetch a cada mudança de filtro (busca debouncada)
  useEffect(() => {
    void (async () => {
      setLoading(true);

      const filters: EstabelecimentosViewFilters = {
        busca: buscaDebounced || undefined,
        tipos: tipos.length > 0 ? tipos : undefined,
        selos: selos.length > 0 ? selos : undefined,
        recursos: recursos.length > 0 ? recursos : undefined,
        estado: estado !== "todos" ? estado : undefined,
        apenasComBeneficio: beneficio,
        apenasComTour360: tour360,
      };

      let res = await fetchEstabelecimentosView(filters);

      const compatScore = (e: EstabelecimentoView) =>
        Object.entries(perfilNecessidades).filter(
          ([k, v]) =>
            v && (e[k as keyof EstabelecimentoView] as unknown as boolean),
        ).length;

      if (ordem === "relevante") {
        res = [...res].sort((a, b) => compatScore(b) - compatScore(a));
      } else if (ordem === "certificados") {
        const score = (e: EstabelecimentoView) =>
          (e.selo_azul ? 3 : 0) +
          (e.selo_governamental ? 2 : 0) +
          (e.selo_privado ? 1 : 0);
        res = [...res].sort((a, b) => score(b) - score(a));
      }
      setList(res);
      setLoading(false);
    })();
  }, [
    buscaDebounced,
    tipos,
    selos,
    recursos,
    estado,
    beneficio,
    tour360,
    ordem,
    perfilNecessidades,
  ]);

  function toggleTipo(v: EstabTipo) {
    setTipos((arr) =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
    );
  }
  function toggleSelo(v: SeloFlag) {
    setSelos((arr) =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
    );
  }
  function toggleRecurso(v: RecursoFlag) {
    setRecursos((arr) =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
    );
  }

  const limpar = () => {
    setBusca("");
    setTipos([]);
    setSelos([]);
    setRecursos([]);
    setEstado("todos");
    setBeneficio(false);
    setTour360(false);
  };

  const filtrosAtivos = useMemo(
    () =>
      tipos.length +
      selos.length +
      recursos.length +
      (estado !== "todos" ? 1 : 0) +
      (beneficio ? 1 : 0) +
      (tour360 ? 1 : 0),
    [tipos, selos, recursos, estado, beneficio, tour360],
  );

  const buscando = busca !== buscaDebounced;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-primary">
          Explorar destinos
        </h1>
        <p className="text-muted-foreground mt-1">
          Encontre estabelecimentos preparados para sua família.
        </p>
        {user && Object.values(perfilNecessidades).some(Boolean) && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-teal-claro text-secondary font-medium">
            ✨ Resultados priorizados pelo perfil sensorial da sua família
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Painel de filtros */}
        <aside
          className={`${
            showFilters
              ? "fixed inset-0 z-50 bg-background overflow-y-auto p-6"
              : "hidden"
          } md:relative md:block md:w-80 md:p-0 md:bg-transparent shrink-0`}
        >
          <div className="md:sticky md:top-20 space-y-6">
            <div className="flex items-center justify-between md:hidden">
              <h2 className="font-display font-bold">Filtros avançados</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Busca com indicador de debounce */}
            <div>
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Busca
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome, cidade, tipo..."
                  className="pl-9 pr-9"
                />
                {buscando && (
                  <span
                    aria-label="Buscando"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-primary border-r-transparent animate-spin"
                  />
                )}
              </div>
            </div>

            {/* Tipos como chips */}
            <FilterGroup label="Tipo de estabelecimento">
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <Chip
                    key={t.v}
                    active={tipos.includes(t.v)}
                    onClick={() => toggleTipo(t.v)}
                    label={t.l}
                  />
                ))}
              </div>
            </FilterGroup>

            {/* Selos como chips com ícone/cor da badge */}
            <FilterGroup label="Selos & certificações">
              <div className="flex flex-wrap gap-2">
                {SELOS_LIST.map((s) => {
                  const b = SELO_BADGES[s];
                  return (
                    <ChipBadge
                      key={s}
                      active={selos.includes(s)}
                      onClick={() => toggleSelo(s)}
                      icon={b.icon}
                      label={b.label}
                      activeClassName={b.className}
                    />
                  );
                })}
              </div>
            </FilterGroup>

            {/* Recursos sensoriais como chips */}
            <FilterGroup label="Recursos sensoriais">
              <div className="flex flex-wrap gap-2">
                {RECURSOS_LIST.map((r) => {
                  const b = RECURSO_BADGES[r];
                  return (
                    <ChipBadge
                      key={r}
                      active={recursos.includes(r)}
                      onClick={() => toggleRecurso(r)}
                      icon={b.icon}
                      label={b.label}
                      activeClassName={b.className}
                    />
                  );
                })}
              </div>
            </FilterGroup>

            {/* Toggles avançados */}
            <FilterGroup label="Experiência">
              <ToggleRow
                id="tour360"
                icon={<Camera className="h-4 w-4" />}
                label="Tour 360° disponível"
                checked={tour360}
                onCheckedChange={setTour360}
              />
              <ToggleRow
                id="ben"
                icon={<Gift className="h-4 w-4" />}
                label="Possui Benefício TEA"
                checked={beneficio}
                onCheckedChange={setBeneficio}
              />
            </FilterGroup>

            <div>
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Estado
              </Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os estados</SelectItem>
                  {ESTADOS_BR.map((e) => (
                    <SelectItem key={e.sigla} value={e.sigla}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtrosAtivos > 0 && (
              <Button
                variant="outline"
                onClick={limpar}
                className="w-full"
              >
                Limpar filtros ({filtrosAtivos})
              </Button>
            )}
          </div>
        </aside>

        {/* Resultados */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {list.length}
              </span>{" "}
              estabelecimentos encontrados
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setShowFilters(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" /> Filtros
                {filtrosAtivos > 0 && ` (${filtrosAtivos})`}
              </Button>
              <Select
                value={ordem}
                onValueChange={(v) => setOrdem(v as typeof ordem)}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevante">Mais relevante</SelectItem>
                  <SelectItem value="certificados">Mais certificados</SelectItem>
                  <SelectItem value="recente">Mais recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chips ativos (resumo dos filtros) */}
          {filtrosAtivos > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mr-1">
                Ativos:
              </span>
              {tipos.map((t) => {
                const def = TIPOS.find((x) => x.v === t);
                return (
                  <ActiveChip
                    key={`a-t-${t}`}
                    label={def?.l ?? t}
                    onRemove={() => toggleTipo(t)}
                  />
                );
              })}
              {selos.map((s) => (
                <ActiveChip
                  key={`a-s-${s}`}
                  label={SELO_BADGES[s].label}
                  onRemove={() => toggleSelo(s)}
                />
              ))}
              {recursos.map((r) => (
                <ActiveChip
                  key={`a-r-${r}`}
                  label={RECURSO_BADGES[r].label}
                  onRemove={() => toggleRecurso(r)}
                />
              ))}
              {estado !== "todos" && (
                <ActiveChip
                  label={
                    ESTADOS_BR.find((e) => e.sigla === estado)?.nome ?? estado
                  }
                  onRemove={() => setEstado("todos")}
                />
              )}
              {beneficio && (
                <ActiveChip
                  label="Benefício TEA"
                  onRemove={() => setBeneficio(false)}
                />
              )}
              {tour360 && (
                <ActiveChip
                  label="Tour 360°"
                  onRemove={() => setTour360(false)}
                />
              )}
            </div>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-2xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-20 bg-muted/40 rounded-2xl">
              <Search className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 font-display font-semibold text-lg text-primary">
                Nenhum estabelecimento encontrado
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os filtros.
              </p>
              <Button variant="outline" onClick={limpar} className="mt-4">
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {list.map((e) => (
                <EstabCard key={e.id} e={e} />
              ))}
            </div>
          )}

          {!user && (
            <div className="mt-10 bg-azul-claro p-6 rounded-2xl text-center">
              <p className="text-primary font-display font-semibold">
                Quer resultados personalizados?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie um perfil sensorial gratuito e veja os destinos mais
                compatíveis com sua família.
              </p>
              <Button asChild className="mt-4">
                <Link to="/cadastro">Criar perfil</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

function ChipBadge({
  active,
  onClick,
  icon,
  label,
  activeClassName,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClassName: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
        active
          ? `${activeClassName} border-transparent shadow-sm`
          : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ToggleRow({
  id,
  icon,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-normal cursor-pointer"
      >
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted text-foreground border border-border">
      {label}
      <button
        type="button"
        aria-label={`Remover filtro ${label}`}
        onClick={onRemove}
        className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
