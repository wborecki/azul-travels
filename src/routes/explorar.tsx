import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EstabCard } from "@/components/EstabCard";
import {
  fetchEstabelecimentosViewPaginated,
  ESTAB_PAGE_SIZE_DEFAULT,
  ESTAB_PAGE_SIZE_MAX,
  fetchFiltrosPadrao,
  salvarFiltrosPadrao,
  limparFiltrosPadrao,
  temFiltrosSalvos,
  type EstabelecimentoView,
  type EstabelecimentosViewFilters,
  type FiltrosPadraoUI,
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
import {
  Search,
  SlidersHorizontal,
  X,
  Camera,
  Gift,
  Link as LinkIcon,
  Check as CheckIcon,
  Sparkles,
  Bookmark,
  BookmarkX,
  Wand2,
} from "lucide-react";
import { ESTADOS_BR } from "@/lib/brazil";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────────
// Search schema — fonte da verdade dos filtros persistidos na URL.
// Cada chip / toggle do painel é refletido aqui.
// ──────────────────────────────────────────────────────────────

const TIPOS_VALORES = [
  "hotel",
  "pousada",
  "resort",
  "restaurante",
  "parque",
  "atracoes",
  "agencia",
  "transporte",
] as const;
type EstabTipo = (typeof TIPOS_VALORES)[number];

const SELOS_VALORES = ["selo_azul", "selo_governamental", "selo_privado"] as const;
const RECURSOS_VALORES = [
  "tem_sala_sensorial",
  "tem_concierge_tea",
  "tem_checkin_antecipado",
  "tem_fila_prioritaria",
  "tem_cardapio_visual",
  "tem_caa",
] as const;

/**
 * Recursos considerados "necessidades mais comuns" do público TEA — base
 * do atalho rápido na toolbar. Escolhidos pelo PO como o trio que cobre
 * a maior fatia das demandas de famílias autistas:
 *
 *  - sala sensorial (ambiente de regulação),
 *  - fila prioritária (reduz tempo de espera, gatilho clássico),
 *  - CAA — Comunicação Aumentativa e Alternativa.
 *
 * Quando há perfil sensorial logado, o atalho **filtra esse trio** pelos
 * recursos de fato necessários à família (`perfilNecessidades`). Sem
 * perfil/login, aplica os três brutos como heurística geral.
 */
const RECURSOS_COMUNS = [
  "tem_sala_sensorial",
  "tem_fila_prioritaria",
  "tem_caa",
] as const satisfies ReadonlyArray<(typeof RECURSOS_VALORES)[number]>;
/**
 * Critério principal de ordenação.
 *
 * - `compatibilidade`: ordena pelo score de compatibilidade com o perfil
 *   sensorial da família (DESC) como critério **principal**. Fallback
 *   automático para selos quando não há perfil ou em empate. Escolher
 *   essa opção também liga `priorizarPerfil` por coerência.
 *
 * - Os demais critérios (`recomendado`, `certificados`, `recente`,
 *   `alfabetica`) podem ser **combinados** com o toggle independente
 *   `priorizarPerfil`, que adiciona o score como pré-camada:
 *
 *     1. (opcional) score de compatibilidade — DESC
 *     2. critério principal selecionado abaixo — DESC/ASC
 *     3. tiebreaker estável: `id` — ASC
 */
const ORDEM_VALORES = [
  "compatibilidade",
  "recomendado",
  "certificados",
  "recente",
  "alfabetica",
] as const;

/**
 * Defaults dos filtros — fonte única usada por:
 *  1. `searchSchema` (`.default(...)`) — valor inicial quando a URL omite.
 *  2. `stripSearchParams` — remove da URL params que estão no default,
 *     deixando links compartilháveis enxutos (ex.: `/explorar?estado=SP`
 *     em vez de `/explorar?q=&tipos=%5B%5D&estado=SP&...`).
 *  3. `limpar()` — restaura tudo para o default e a URL volta a ser `/explorar`.
 */
const SEARCH_DEFAULTS = {
  q: "",
  tipos: [] as EstabTipo[],
  selos: [] as (typeof SELOS_VALORES)[number][],
  recursos: [] as (typeof RECURSOS_VALORES)[number][],
  estado: "todos",
  beneficio: false,
  tour360: false,
  ordem: "recomendado" as (typeof ORDEM_VALORES)[number],
  // Quando true E o usuário tem perfil sensorial, soma o score de
  // compatibilidade na frente da ordenação. Default: true (a página
  // só é útil se priorizar quem precisa).
  priorizarPerfil: true,
  pagina: 1,
  tamanhoPagina: ESTAB_PAGE_SIZE_DEFAULT,
} as const;

const searchSchema = z.object({
  q: fallback(z.string(), SEARCH_DEFAULTS.q).default(SEARCH_DEFAULTS.q),
  tipos: fallback(z.array(z.enum(TIPOS_VALORES)), []).default([]),
  selos: fallback(z.array(z.enum(SELOS_VALORES)), []).default([]),
  recursos: fallback(z.array(z.enum(RECURSOS_VALORES)), []).default([]),
  estado: fallback(z.string(), SEARCH_DEFAULTS.estado).default(SEARCH_DEFAULTS.estado),
  beneficio: fallback(z.boolean(), SEARCH_DEFAULTS.beneficio).default(SEARCH_DEFAULTS.beneficio),
  tour360: fallback(z.boolean(), SEARCH_DEFAULTS.tour360).default(SEARCH_DEFAULTS.tour360),
  ordem: fallback(z.enum(ORDEM_VALORES), SEARCH_DEFAULTS.ordem).default(SEARCH_DEFAULTS.ordem),
  priorizarPerfil: fallback(z.boolean(), SEARCH_DEFAULTS.priorizarPerfil).default(
    SEARCH_DEFAULTS.priorizarPerfil,
  ),
  // Paginação tipada — clampada na fetcher (resolvePagination).
  pagina: fallback(z.number().int().min(1), SEARCH_DEFAULTS.pagina).default(SEARCH_DEFAULTS.pagina),
  tamanhoPagina: fallback(
    z.number().int().min(1).max(ESTAB_PAGE_SIZE_MAX),
    SEARCH_DEFAULTS.tamanhoPagina,
  ).default(SEARCH_DEFAULTS.tamanhoPagina),
});

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

export const Route = createFileRoute("/explorar")({
  validateSearch: zodValidator(searchSchema),
  // Mantém a URL limpa: params iguais ao default não aparecem na barra
  // de endereços. Compartilhar `/explorar?estado=SP` é equivalente a
  // visitar `/explorar?q=&tipos=[]&estado=SP&pagina=1&...`.
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
  head: () => ({
    meta: [
      { title: "Explorar destinos — Turismo Azul" },
      {
        name: "description",
        content: "Encontre hotéis, restaurantes e parques realmente preparados para famílias TEA.",
      },
    ],
  }),
  component: Explorar,
});

type ExplorarSearch = z.infer<typeof searchSchema>;

function Explorar() {
  const search = Route.useSearch() as ExplorarSearch;
  const navigate = useNavigate({ from: "/explorar" });
  const { user } = useAuth();

  // Estado local do input de busca (debouncado antes de virar URL).
  const [busca, setBusca] = useState(search.q);
  const buscaDebounced = useDebouncedValue(busca, 350);

  // Sincroniza input → URL quando o termo "assenta". Reseta a página
  // (mudou o termo, faz sentido voltar para a primeira).
  useEffect(() => {
    if (buscaDebounced !== search.q) {
      void navigate({
        search: (prev: ExplorarSearch) => ({ ...prev, q: buscaDebounced, pagina: 1 }),
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced]);

  // Se a URL mudar por fora (ex.: link compartilhado), realinha o input.
  useEffect(() => {
    if (search.q !== busca && search.q !== buscaDebounced) {
      setBusca(search.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.q]);

  const [list, setList] = useState<EstabelecimentoView[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  // `loading` = primeira página dos filtros atuais (mostra skeletons).
  // `loadingMore` = páginas subsequentes (infinite scroll, mostra spinner).
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [perfilNecessidades, setPerfilNecessidades] = useState<Record<string, boolean>>({});
  // Filtro padrão salvo do usuário (1:1) — `null` = ainda não carregou /
  // não tem registro. Usado para (a) auto-aplicar ao entrar limpo e
  // (b) decidir se o botão da toolbar diz "Salvar" ou "Limpar padrão".
  const [filtroPadrao, setFiltroPadrao] = useState<FiltrosPadraoUI | null>(null);
  const [salvandoPadrao, setSalvandoPadrao] = useState(false);
  // Garante que a auto-aplicação roda no máximo uma vez por sessão da
  // rota — sem isso, voltar para `/explorar` "limpo" via Link reaplicaria
  // os defaults a cada render do efeito.
  const autoAplicadoRef = useRef(false);
  // Sentinel observado pelo IntersectionObserver — quando entra na
  // viewport, dispara o carregamento da próxima página.
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /**
   * Atualiza a query string preservando outros params e **reseta a
   * paginação para 1** — todos os controles de filtro/ordem chamam
   * isso para que o usuário não fique numa página vazia ao filtrar.
   */
  function patchSearchResetPage(patch: Partial<ExplorarSearch>) {
    void navigate({
      search: (prev: ExplorarSearch) => ({ ...prev, ...patch, pagina: 1 }),
      replace: true,
    });
  }

  /** Navega para uma página específica (usado pelo paginador). */
  function goToPage(pagina: number) {
    void navigate({
      search: (prev: ExplorarSearch) => ({ ...prev, pagina }),
      replace: true,
    });
  }

  function toggleInArray<T extends string>(arr: readonly T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

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

  // ───────────────────────────────────────────────────────────────
  // Filtro padrão do usuário — carrega ao logar; auto-aplica quando
  // o usuário entra em /explorar "limpo" (sem filtros relevantes na
  // URL). Links compartilhados continuam vencendo: se há `tipos`,
  // `selos` ou `recursos` na query, o padrão é ignorado.
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setFiltroPadrao(null);
      return;
    }
    void (async () => {
      try {
        const f = await fetchFiltrosPadrao(user.id);
        setFiltroPadrao(f);

        const urlVazia =
          search.tipos.length === 0 &&
          search.selos.length === 0 &&
          search.recursos.length === 0;

        if (!autoAplicadoRef.current && urlVazia && temFiltrosSalvos(f)) {
          autoAplicadoRef.current = true;
          patchSearchResetPage({
            tipos: [...f.tipos] as EstabTipo[],
            selos: [...f.selos] as (typeof SELOS_VALORES)[number][],
            recursos: [...f.recursos] as (typeof RECURSOS_VALORES)[number][],
          });
        }
      } catch (e) {
        console.error("Falha ao carregar filtros padrão", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function salvarComoPadrao() {
    if (!user) {
      toast.info("Faça login para salvar seus filtros favoritos.");
      return;
    }
    setSalvandoPadrao(true);
    try {
      const novo: FiltrosPadraoUI = {
        tipos: search.tipos,
        selos: search.selos,
        recursos: search.recursos,
      };
      await salvarFiltrosPadrao(user.id, novo);
      setFiltroPadrao(novo);
      toast.success("Filtros salvos como seu padrão.");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível salvar os filtros.");
    } finally {
      setSalvandoPadrao(false);
    }
  }

  async function removerPadrao() {
    if (!user) return;
    setSalvandoPadrao(true);
    try {
      await limparFiltrosPadrao(user.id);
      setFiltroPadrao(null);
      toast.success("Filtros padrão removidos.");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível remover os filtros padrão.");
    } finally {
      setSalvandoPadrao(false);
    }
  }

  // Refetch a cada mudança de filtro/página (URL é a fonte da verdade)
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Página 1 → reset visual (skeletons). Páginas seguintes → spinner
      // discreto no fim da lista (loadingMore).
      if (search.pagina === 1) setLoading(true);
      else setLoadingMore(true);

      const filters: EstabelecimentosViewFilters = {
        busca: search.q || undefined,
        tipos: search.tipos.length > 0 ? search.tipos : undefined,
        selos: search.selos.length > 0 ? search.selos : undefined,
        recursos: search.recursos.length > 0 ? search.recursos : undefined,
        estado: search.estado !== "todos" ? search.estado : undefined,
        apenasComBeneficio: search.beneficio,
        apenasComTour360: search.tour360,
        pagina: search.pagina,
        tamanhoPagina: search.tamanhoPagina,
      };

      const page = await fetchEstabelecimentosViewPaginated(filters);
      if (cancelled) return;

      // ─────────────────────────────────────────────────────────────
      // Ordenação local determinística e composta.
      //
      // Roda no cliente sobre TODOS os itens acumulados (não só a
      // página recém-chegada) para que o infinite scroll mantenha a
      // ordem global correta — caso contrário, um item da página 2
      // com score alto apareceria depois de itens piores da página 1.
      //
      // Camadas (sempre nesta ordem, primeira diferença vence):
      //   A. priorizarPerfil → score de compatibilidade (DESC)
      //   B. critério principal selecionado em `ordem`    (DESC/ASC)
      //   C. tiebreaker estável: id                       (ASC)
      // ─────────────────────────────────────────────────────────────

      const compatScore = (e: EstabelecimentoView) =>
        Object.entries(perfilNecessidades).filter(
          ([k, v]) => v && (e[k as keyof EstabelecimentoView] as unknown as boolean),
        ).length;

      const seloScore = (e: EstabelecimentoView) =>
        (e.selo_azul ? 3 : 0) + (e.selo_governamental ? 2 : 0) + (e.selo_privado ? 1 : 0);

      const compareCriterio = (a: EstabelecimentoView, b: EstabelecimentoView): number => {
        switch (search.ordem) {
          case "compatibilidade": {
            // Critério principal = score de compatibilidade. Em empate
            // (ou quando o usuário ainda não tem perfil → score 0 para
            // todos), cai para o ranking por selos para não devolver
            // ordem aleatória.
            const diff = compatScore(b) - compatScore(a);
            if (diff !== 0) return diff;
            return seloScore(b) - seloScore(a);
          }
          case "certificados":
            return seloScore(b) - seloScore(a);
          case "alfabetica":
            return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
          case "recente":
            return b.id.localeCompare(a.id);
          case "recomendado":
          default:
            return seloScore(b) - seloScore(a);
        }
      };

      const sortItems = (arr: EstabelecimentoView[]) =>
        [...arr].sort((a, b) => {
          // O toggle `priorizarPerfil` adiciona o score como pré-camada
          // — exceto quando o critério principal já É a compatibilidade
          // (evita aplicar a mesma comparação duas vezes).
          if (search.priorizarPerfil && search.ordem !== "compatibilidade") {
            const diff = compatScore(b) - compatScore(a);
            if (diff !== 0) return diff;
          }
          const diff = compareCriterio(a, b);
          if (diff !== 0) return diff;
          return a.id.localeCompare(b.id);
        });

      setList((prev) => {
        // Página 1 → substitui (filtros mudaram, ou load inicial).
        // Página >1 → concatena, deduplicando por id (proteção contra
        // race conditions e contra mesma página vir duas vezes).
        const merged =
          search.pagina === 1
            ? page.items
            : (() => {
                const seen = new Set(prev.map((p) => p.id));
                const novos = page.items.filter((it) => !seen.has(it.id));
                return [...prev, ...novos];
              })();
        return sortItems(merged);
      });
      setTotal(page.total);
      setTotalPaginas(page.totalPaginas);
      setLoading(false);
      setLoadingMore(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    search.q,
    search.tipos,
    search.selos,
    search.recursos,
    search.estado,
    search.beneficio,
    search.tour360,
    search.ordem,
    search.priorizarPerfil,
    search.pagina,
    search.tamanhoPagina,
    perfilNecessidades,
  ]);

  // ───────────────────────────────────────────────────────────────
  // Infinite scroll — IntersectionObserver no sentinel pós-grid.
  //
  // Quando o sentinel entra na viewport (com 200px de antecedência),
  // dispara `goToPage(pagina + 1)`. Guards:
  //   - não está carregando uma página ainda
  //   - existe próxima página (`pagina < totalPaginas`)
  //   - lista não está vazia (evita loop em "nenhum resultado")
  // ───────────────────────────────────────────────────────────────
  const podeCarregarMais = !loading && !loadingMore && search.pagina < totalPaginas;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !podeCarregarMais) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          goToPage(search.pagina + 1);
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeCarregarMais, search.pagina, totalPaginas]);


  const limpar = () => {
    setBusca("");
    // Volta a URL para `/explorar` puro — `stripSearchParams` cuida de
    // remover qualquer chave que case com SEARCH_DEFAULTS. Mantém o
    // tamanhoPagina escolhido pelo usuário (preferência da sessão).
    void navigate({
      search: { ...SEARCH_DEFAULTS, tamanhoPagina: search.tamanhoPagina },
      replace: true,
    });
  };

  const filtrosAtivos = useMemo(
    () =>
      search.tipos.length +
      search.selos.length +
      search.recursos.length +
      (search.estado !== "todos" ? 1 : 0) +
      (search.beneficio ? 1 : 0) +
      (search.tour360 ? 1 : 0),
    [search.tipos, search.selos, search.recursos, search.estado, search.beneficio, search.tour360],
  );

  const buscando = busca !== buscaDebounced;
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      toast.success("Link copiado! Compartilhe os filtros com sua família.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-primary">Explorar destinos</h1>
        <p className="text-muted-foreground mt-1">
          Encontre estabelecimentos preparados para sua família.
        </p>
        {(search.ordem === "compatibilidade" || search.priorizarPerfil) &&
          user &&
          Object.values(perfilNecessidades).some(Boolean) && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-teal-claro text-secondary font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              {search.ordem === "compatibilidade"
                ? "Ordenado pelos destinos mais compatíveis com sua família"
                : "Resultados priorizados pelo perfil sensorial da sua família"}
            </div>
          )}
        {search.ordem === "compatibilidade" &&
          (!user || !Object.values(perfilNecessidades).some(Boolean)) && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {!user
                ? "Faça login e cadastre um perfil sensorial para ver as recomendações personalizadas."
                : "Cadastre necessidades no perfil sensorial para ativar as recomendações personalizadas."}
            </div>
          )}
      </div>

      <div className="flex gap-6">
        {/* Painel de filtros */}
        <aside
          className={`${
            showFilters ? "fixed inset-0 z-50 bg-background overflow-y-auto p-6" : "hidden"
          } md:relative md:block md:w-80 md:p-0 md:bg-transparent shrink-0`}
        >
          <div className="md:sticky md:top-20 space-y-6">
            <div className="flex items-center justify-between md:hidden">
              <h2 className="font-display font-bold">Filtros avançados</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
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
                    active={search.tipos.includes(t.v)}
                    onClick={() => patchSearchResetPage({ tipos: toggleInArray(search.tipos, t.v) })}
                    label={t.l}
                  />
                ))}
              </div>
            </FilterGroup>

            {/* Selos */}
            <FilterGroup label="Selos & certificações">
              <div className="flex flex-wrap gap-2">
                {SELOS_VALORES.map((s) => {
                  const b = SELO_BADGES[s];
                  return (
                    <ChipBadge
                      key={s}
                      active={search.selos.includes(s)}
                      onClick={() => patchSearchResetPage({ selos: toggleInArray(search.selos, s) })}
                      icon={b.icon}
                      label={b.label}
                      activeClassName={b.className}
                    />
                  );
                })}
              </div>
            </FilterGroup>

            {/* Recursos sensoriais */}
            <FilterGroup label="Recursos sensoriais">
              <div className="flex flex-wrap gap-2">
                {RECURSOS_VALORES.map((r) => {
                  const b = RECURSO_BADGES[r];
                  return (
                    <ChipBadge
                      key={r}
                      active={search.recursos.includes(r)}
                      onClick={() =>
                        patchSearchResetPage({
                          recursos: toggleInArray(search.recursos, r),
                        })
                      }
                      icon={b.icon}
                      label={b.label}
                      activeClassName={b.className}
                    />
                  );
                })}
              </div>
            </FilterGroup>

            {/* Ordenação — toggle independente que se combina com `ordem` */}
            <FilterGroup label="Ordenação">
              <ToggleRow
                id="prioriza-perfil"
                icon={<Sparkles className="h-4 w-4" />}
                label="Priorizar perfil sensorial"
                checked={search.priorizarPerfil}
                onCheckedChange={(v) => patchSearchResetPage({ priorizarPerfil: v })}
              />
              {search.priorizarPerfil && !user && (
                <p className="text-[11px] text-muted-foreground pl-7 -mt-1">
                  Faça login e cadastre um perfil sensorial para ver o efeito.
                </p>
              )}
              {search.priorizarPerfil &&
                user &&
                !Object.values(perfilNecessidades).some(Boolean) && (
                  <p className="text-[11px] text-muted-foreground pl-7 -mt-1">
                    Cadastre necessidades no perfil para ativar a priorização.
                  </p>
                )}
            </FilterGroup>

            {/* Toggles avançados */}
            <FilterGroup label="Experiência">
              <ToggleRow
                id="tour360"
                icon={<Camera className="h-4 w-4" />}
                label="Tour 360° disponível"
                checked={search.tour360}
                onCheckedChange={(v) => patchSearchResetPage({ tour360: v })}
              />
              <ToggleRow
                id="ben"
                icon={<Gift className="h-4 w-4" />}
                label="Possui Benefício TEA"
                checked={search.beneficio}
                onCheckedChange={(v) => patchSearchResetPage({ beneficio: v })}
              />
            </FilterGroup>

            <div>
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Estado
              </Label>
              <Select value={search.estado} onValueChange={(v) => patchSearchResetPage({ estado: v })}>
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
              <Button variant="outline" onClick={limpar} className="w-full">
                Limpar filtros ({filtrosAtivos})
              </Button>
            )}
          </div>
        </aside>

        {/* Resultados */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{list.length}</span> estabelecimentos
              encontrados
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
              <Button
                variant="outline"
                size="sm"
                onClick={copiarLink}
                title="Copiar link com filtros"
              >
                {copiado ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1" /> Copiado
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-1" /> Compartilhar
                  </>
                )}
              </Button>
              <Select
                value={search.ordem}
                onValueChange={(v) => {
                  const ordem = v as (typeof ORDEM_VALORES)[number];
                  // Coerência: ao escolher "compatibilidade" como critério
                  // principal, ligamos `priorizarPerfil` automaticamente
                  // (caso o usuário tenha desligado antes). O toggle no
                  // painel continua disponível como override.
                  patchSearchResetPage(
                    ordem === "compatibilidade"
                      ? { ordem, priorizarPerfil: true }
                      : { ordem },
                  );
                }}
              >
                <SelectTrigger className="w-[260px] h-9" aria-label="Ordenar resultados">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compatibilidade">
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-secondary" />
                      Mais compatíveis com minha família
                    </span>
                  </SelectItem>
                  <SelectItem value="recomendado">Recomendado</SelectItem>
                  <SelectItem value="certificados">Mais certificados</SelectItem>
                  <SelectItem value="recente">Mais recentes</SelectItem>
                  <SelectItem value="alfabetica">A → Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chips ativos */}
          {filtrosAtivos > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mr-1">
                Ativos:
              </span>
              {search.tipos.map((t: EstabTipo) => {
                const def = TIPOS.find((x) => x.v === t);
                return (
                  <ActiveChip
                    key={`a-t-${t}`}
                    label={def?.l ?? t}
                    onRemove={() => patchSearchResetPage({ tipos: toggleInArray(search.tipos, t) })}
                  />
                );
              })}
              {search.selos.map((s: (typeof SELOS_VALORES)[number]) => (
                <ActiveChip
                  key={`a-s-${s}`}
                  label={SELO_BADGES[s].label}
                  onRemove={() => patchSearchResetPage({ selos: toggleInArray(search.selos, s) })}
                />
              ))}
              {search.recursos.map((r: (typeof RECURSOS_VALORES)[number]) => (
                <ActiveChip
                  key={`a-r-${r}`}
                  label={RECURSO_BADGES[r].label}
                  onRemove={() =>
                    patchSearchResetPage({
                      recursos: toggleInArray(search.recursos, r),
                    })
                  }
                />
              ))}
              {search.estado !== "todos" && (
                <ActiveChip
                  label={ESTADOS_BR.find((e) => e.sigla === search.estado)?.nome ?? search.estado}
                  onRemove={() => patchSearchResetPage({ estado: "todos" })}
                />
              )}
              {search.beneficio && (
                <ActiveChip
                  label="Benefício TEA"
                  onRemove={() => patchSearchResetPage({ beneficio: false })}
                />
              )}
              {search.tour360 && (
                <ActiveChip label="Tour 360°" onRemove={() => patchSearchResetPage({ tour360: false })} />
              )}
            </div>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-20 bg-muted/40 rounded-2xl">
              <Search className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 font-display font-semibold text-lg text-primary">
                Nenhum estabelecimento encontrado
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros.</p>
              <Button variant="outline" onClick={limpar} className="mt-4">
                Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-3 text-xs text-muted-foreground">
                Mostrando <strong className="text-foreground">{list.length}</strong> de{" "}
                <strong className="text-foreground">{total}</strong> resultado
                {total === 1 ? "" : "s"}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((e) => (
                  <EstabCard key={e.id} e={e} />
                ))}
              </div>

              {/* Spinner discreto enquanto a próxima página carrega */}
              {loadingMore && (
                <div
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  <span className="h-3 w-3 rounded-full border-2 border-primary border-r-transparent animate-spin" />
                  Carregando mais resultados...
                </div>
              )}

              {/*
                Sentinel + fallback acessível.
                - O sentinel (div vazia) é observada pelo IntersectionObserver
                  e dispara `goToPage` automaticamente ao entrar na viewport.
                - O botão "Carregar mais" é um fallback para teclado, leitores
                  de tela e navegadores sem IntersectionObserver — tem o mesmo
                  efeito programático.
              */}
              {search.pagina < totalPaginas && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div ref={sentinelRef} aria-hidden="true" className="h-1 w-full" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(search.pagina + 1)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Carregando..." : "Carregar mais"}
                  </Button>
                </div>
              )}

              {/* Mensagem final quando tudo foi carregado */}
              {search.pagina >= totalPaginas && totalPaginas > 1 && (
                <p className="mt-8 text-center text-xs text-muted-foreground">
                  Você chegou ao fim — {total} resultado{total === 1 ? "" : "s"}.
                </p>
              )}
            </>
          )}

          {!user && (
            <div className="mt-10 bg-azul-claro p-6 rounded-2xl text-center">
              <p className="text-primary font-display font-semibold">
                Quer resultados personalizados?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie um perfil sensorial gratuito e veja os destinos mais compatíveis com sua
                família.
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
      <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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
      <Label htmlFor={id} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
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
