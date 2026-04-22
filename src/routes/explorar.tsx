import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EstabCard } from "@/components/EstabCard";
import { ESTAB_VIEW_SELECT, type EstabelecimentoView } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ESTADOS_BR } from "@/lib/brazil";
import { useAuth } from "@/hooks/useAuth";

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
      { name: "description", content: "Encontre hotéis, restaurantes e parques realmente preparados para famílias TEA." },
    ],
  }),
  component: Explorar,
});

const TIPOS = [
  { v: "hotel", l: "Hotel" },
  { v: "pousada", l: "Pousada" },
  { v: "resort", l: "Resort" },
  { v: "restaurante", l: "Restaurante" },
  { v: "parque", l: "Parque" },
  { v: "atracoes", l: "Atrações" },
  { v: "agencia", l: "Agência" },
  { v: "transporte", l: "Transporte" },
];

const RECURSOS = [
  { v: "tem_sala_sensorial", l: "Sala Sensorial" },
  { v: "tem_concierge_tea", l: "Concierge TEA" },
  { v: "tem_checkin_antecipado", l: "Check-in Antecipado" },
  { v: "tem_fila_prioritaria", l: "Fila Prioritária" },
  { v: "tem_cardapio_visual", l: "Cardápio Visual" },
  { v: "tem_caa", l: "CAA Disponível" },
] as const;

const SELOS = [
  { v: "selo_azul", l: "Selo Azul (Absoluto Educacional)" },
  { v: "selo_governamental", l: "Certificado Governamental" },
  { v: "selo_privado", l: "Selo Privado" },
];

function Explorar() {
  const { q, tipo } = Route.useSearch();
  const { user } = useAuth();

  const [busca, setBusca] = useState(q ?? "");
  const [tipos, setTipos] = useState<string[]>(tipo ? [tipo] : []);
  const [selos, setSelos] = useState<string[]>([]);
  const [recursos, setRecursos] = useState<string[]>([]);
  const [estado, setEstado] = useState<string>("todos");
  const [beneficio, setBeneficio] = useState(false);
  const [tour360, setTour360] = useState(false);
  const [ordem, setOrdem] = useState<"relevante" | "recente" | "certificados">("relevante");
  const [list, setList] = useState<Estab[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [perfilNecessidades, setPerfilNecessidades] = useState<Record<string, boolean>>({});

  // Carrega necessidades do primeiro perfil sensorial da família para personalizar
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

  useEffect(() => {
    void (async () => {
      setLoading(true);
      let query = supabase.from("estabelecimentos").select("*").eq("status", "ativo");
      if (busca) query = query.or(`nome.ilike.%${busca}%,cidade.ilike.%${busca}%,descricao.ilike.%${busca}%,tipo.ilike.%${busca}%`);
      if (tipos.length > 0) query = query.in("tipo", tipos as ("hotel"|"pousada"|"resort"|"restaurante"|"parque"|"atracoes"|"agencia"|"transporte")[]);
      if (estado !== "todos") query = query.eq("estado", estado);
      if (beneficio) query = query.eq("tem_beneficio_tea", true);
      if (tour360) query = query.not("tour_360_url", "is", null);
      for (const s of selos) query = query.eq(s, true);
      for (const r of recursos) query = query.eq(r, true);

      const { data } = await query;
      let res = (data as Estab[]) ?? [];

      // Sort by perfil compatibility
      const compatScore = (e: Estab) =>
        Object.entries(perfilNecessidades).filter(([k, v]) => v && (e as unknown as Record<string, boolean>)[k]).length;

      if (ordem === "relevante") {
        res = res.sort((a, b) => compatScore(b) - compatScore(a));
      } else if (ordem === "certificados") {
        const score = (e: Estab) => (e.selo_azul ? 3 : 0) + (e.selo_governamental ? 2 : 0) + (e.selo_privado ? 1 : 0);
        res = res.sort((a, b) => score(b) - score(a));
      }
      setList(res);
      setLoading(false);
    })();
  }, [busca, tipos, selos, recursos, estado, beneficio, tour360, ordem, perfilNecessidades]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const limpar = () => {
    setBusca(""); setTipos([]); setSelos([]); setRecursos([]); setEstado("todos"); setBeneficio(false); setTour360(false);
  };

  const filtrosAtivos = useMemo(
    () => tipos.length + selos.length + recursos.length + (estado !== "todos" ? 1 : 0) + (beneficio ? 1 : 0) + (tour360 ? 1 : 0),
    [tipos, selos, recursos, estado, beneficio, tour360],
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-primary">Explorar destinos</h1>
        <p className="text-muted-foreground mt-1">Encontre estabelecimentos preparados para sua família.</p>
        {user && Object.values(perfilNecessidades).some(Boolean) && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-teal-claro text-secondary font-medium">
            ✨ Resultados priorizados pelo perfil sensorial da sua família
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filtros */}
        <aside
          className={`${
            showFilters ? "fixed inset-0 z-50 bg-background overflow-y-auto p-6" : "hidden"
          } md:relative md:block md:w-72 md:p-0 md:bg-transparent shrink-0`}
        >
          <div className="md:sticky md:top-20 space-y-6">
            <div className="flex items-center justify-between md:hidden">
              <h2 className="font-display font-bold">Filtros</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div>
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Busca</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, cidade..." className="pl-9" />
              </div>
            </div>

            <FilterGroup label="Tipo">
              {TIPOS.map((t) => (
                <Check key={t.v} id={`t-${t.v}`} checked={tipos.includes(t.v)} onChange={() => toggle(tipos, setTipos, t.v)} label={t.l} />
              ))}
            </FilterGroup>

            <FilterGroup label="Selos">
              {SELOS.map((s) => (
                <Check key={s.v} id={`s-${s.v}`} checked={selos.includes(s.v)} onChange={() => toggle(selos, setSelos, s.v)} label={s.l} />
              ))}
            </FilterGroup>

            <FilterGroup label="Recursos sensoriais">
              {RECURSOS.map((r) => (
                <Check key={r.v} id={`r-${r.v}`} checked={recursos.includes(r.v)} onChange={() => toggle(recursos, setRecursos, r.v)} label={r.l} />
              ))}
              <Check id="tour360" checked={tour360} onChange={() => setTour360((v) => !v)} label="Tour 360° disponível" />
            </FilterGroup>

            <FilterGroup label="Benefícios">
              <Check id="ben" checked={beneficio} onChange={() => setBeneficio((v) => !v)} label="Possui Benefício TEA" />
            </FilterGroup>

            <div>
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os estados</SelectItem>
                  {ESTADOS_BR.map((e) => (
                    <SelectItem key={e.sigla} value={e.sigla}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtrosAtivos > 0 && (
              <Button variant="outline" onClick={limpar} className="w-full">Limpar filtros ({filtrosAtivos})</Button>
            )}
          </div>
        </aside>

        {/* Resultados */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{list.length}</span> estabelecimentos encontrados
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal className="h-4 w-4 mr-1" /> Filtros {filtrosAtivos > 0 && `(${filtrosAtivos})`}
              </Button>
              <Select value={ordem} onValueChange={(v) => setOrdem(v as typeof ordem)}>
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

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-20 bg-muted/40 rounded-2xl">
              <Search className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 font-display font-semibold text-lg text-primary">Nenhum estabelecimento encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros.</p>
              <Button variant="outline" onClick={limpar} className="mt-4">Limpar filtros</Button>
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
              <p className="text-primary font-display font-semibold">Quer resultados personalizados?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie um perfil sensorial gratuito e veja os destinos mais compatíveis com sua família.
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

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">{label}</Label>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function Check({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
