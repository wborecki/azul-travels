import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { List, Loader2, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/explorar/SearchBar";
import { FiltrosModal } from "@/components/explorar/FiltrosModal";
import { ResultadosLista } from "@/components/explorar/ResultadosLista";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  fetchItensViewMapa,
  fetchItensViewPaginated,
  fetchFiltrosPadrao,
  salvarFiltrosPadrao,
  temFiltrosSalvos,
  type ItensViewMapa,
  type ItensViewPage,
  type Ordenacao,
} from "@/lib/queries";
import {
  ORDENACAO_LABEL,
  contarFiltrosAtivos,
  csvOrUndefined,
  limparAreaMapa,
  parseRecursosCsv,
  parseSelosCsv,
  parseTiposCsv,
  searchToFilters,
  temAreaMapa,
  temFiltrosRelevantes,
  validateExplorarSearch,
  type ExplorarSearch,
} from "@/lib/explorar-search";
import type { BoundsSimples } from "@/components/explorar/MapView";

const MapView = lazy(() =>
  import("@/components/explorar/MapView").then((m) => ({ default: m.MapView })),
);

export const Route = createFileRoute("/explorar")({
  validateSearch: validateExplorarSearch,
  head: () => ({
    meta: [
      { title: "Explorar quartos · Turismo Azul" },
      {
        name: "description",
        content:
          "Encontre quartos e acomodações em hotéis, pousadas e resorts preparados para receber famílias TEA.",
      },
    ],
  }),
  component: ExplorarPage,
});

const ORDENACOES_UI: ReadonlyArray<Ordenacao> = ["preco_asc", "preco_desc", "avaliacao"];

function ExplorarPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explorar" });
  const { user, loading: authLoading } = useAuth();

  const [pageData, setPageData] = useState<ItensViewPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [salvandoPadrao, setSalvandoPadrao] = useState(false);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [mapaData, setMapaData] = useState<ItensViewMapa | null>(null);
  const [mapaLoading, setMapaLoading] = useState(false);
  const [mapaErro, setMapaErro] = useState(false);
  const areaMapaAtiva = temAreaMapa(search);
  const mapaVisivel = search.mapa === true;

  function toggleMapa() {
    patchSearch({ mapa: mapaVisivel ? undefined : true });
  }

  function handleBoundsChange(bounds: BoundsSimples) {
    // replace: o pan do mapa não deve empilhar entradas no histórico do navegador.
    void navigate({
      replace: true,
      search: (prev) => ({
        ...prev,
        bbox_n: bounds.norte,
        bbox_s: bounds.sul,
        bbox_e: bounds.leste,
        bbox_o: bounds.oeste,
        centro_lat: undefined,
        centro_lng: undefined,
        raio_km: undefined,
        pagina: undefined,
      }),
    });
  }

  function handlePertoDeMim(coords: { lat: number; lng: number }) {
    patchSearch({
      centro_lat: coords.lat,
      centro_lng: coords.lng,
      raio_km: search.raio_km ?? 20,
      bbox_n: undefined,
      bbox_s: undefined,
      bbox_e: undefined,
      bbox_o: undefined,
    });
  }

  function limparArea() {
    void navigate({ search: (prev) => ({ ...limparAreaMapa(prev), pagina: undefined }) });
  }

  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErro(false);
    fetchItensViewPaginated(searchToFilters(search))
      .then((page) => {
        if (alive) setPageData(page);
      })
      .catch((err) => {
        console.error(err);
        if (!alive) return;
        setErro(true);
        toast.error("Não foi possível carregar os quartos.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [search, tentativa]);

  useEffect(() => {
    if (!mapaVisivel) return;
    let alive = true;
    setMapaLoading(true);
    setMapaErro(false);
    fetchItensViewMapa(searchToFilters(search))
      .then((dados) => {
        if (alive) setMapaData(dados);
      })
      .catch((err) => {
        console.error(err);
        if (!alive) return;
        setMapaErro(true);
        toast.error("Não foi possível carregar o mapa.");
      })
      .finally(() => alive && setMapaLoading(false));
    return () => {
      alive = false;
    };
  }, [mapaVisivel, search, tentativa]);

  useEffect(() => {
    if (loading || !pageData) return;
    if (
      pageData.total > 0 &&
      pageData.items.length === 0 &&
      pageData.pagina > pageData.totalPaginas
    ) {
      void navigate({
        replace: true,
        search: (prev) => ({
          ...prev,
          pagina: pageData.totalPaginas > 1 ? pageData.totalPaginas : undefined,
        }),
      });
    }
  }, [loading, pageData, navigate]);

  const filtrosPadraoVerificados = useRef(false);
  useEffect(() => {
    if (filtrosPadraoVerificados.current || authLoading) return;
    filtrosPadraoVerificados.current = true;
    if (!user || temFiltrosRelevantes(search)) return;
    fetchFiltrosPadrao(user.id)
      .then((salvos) => {
        if (!temFiltrosSalvos(salvos)) return;
        void navigate({
          replace: true,
          search: (prev) =>
            temFiltrosRelevantes(prev)
              ? prev
              : {
                  ...prev,
                  tipos: csvOrUndefined(parseTiposCsv(salvos.tipos.join(","))),
                  selos: csvOrUndefined(parseSelosCsv(salvos.selos.join(","))),
                  recursos: csvOrUndefined(parseRecursosCsv(salvos.recursos.join(","))),
                },
        });
      })
      .catch(() => {});
  }, [authLoading, user, search, navigate]);

  function patchSearch(patch: Partial<ExplorarSearch>) {
    void navigate({ search: (prev) => ({ ...prev, ...patch, pagina: undefined }) });
  }

  function irParaPagina(pagina: number) {
    void navigate({ search: (prev) => ({ ...prev, pagina: pagina > 1 ? pagina : undefined }) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limparTudo() {
    void navigate({ search: {} });
  }

  async function salvarComoPadrao() {
    if (!user) return;
    setSalvandoPadrao(true);
    try {
      await salvarFiltrosPadrao(user.id, {
        tipos: parseTiposCsv(search.tipos),
        selos: parseSelosCsv(search.selos),
        recursos: parseRecursosCsv(search.recursos),
      });
      toast.success("Filtros salvos como padrão.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar os filtros.");
    } finally {
      setSalvandoPadrao(false);
    }
  }

  const tiposAtuais = parseTiposCsv(search.tipos);
  const tipoAtivo = tiposAtuais.length === 1 ? tiposAtuais[0] : undefined;
  const temFiltros = temFiltrosRelevantes(search);
  const filtrosAtivos = contarFiltrosAtivos(search);

  const centroFoco =
    search.centro_lat !== undefined && search.centro_lng !== undefined
      ? { lat: search.centro_lat, lng: search.centro_lng }
      : undefined;

  const onTentarNovamente = () => setTentativa((t) => t + 1);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 pt-8 pb-16">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">
            Explorar destinos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quartos e acomodações preparados para receber famílias TEA.
          </p>

          <div className="mt-5">
            <SearchBar
              valor={search.busca ?? ""}
              onBuscar={(termo) => patchSearch({ busca: termo || undefined })}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setFiltrosAbertos(true)}>
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              Filtros
              {filtrosAtivos > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                  {filtrosAtivos}
                </span>
              )}
            </Button>

            <Button
              variant={mapaVisivel ? "default" : "outline"}
              onClick={toggleMapa}
              className="hidden lg:inline-flex"
            >
              <MapIcon className="h-4 w-4 mr-1.5" />
              {mapaVisivel ? "Ocultar mapa" : "Mostrar mapa"}
            </Button>

            {areaMapaAtiva && (
              <button
                type="button"
                onClick={limparArea}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
              >
                {search.centro_lat !== undefined ? "Perto de você" : "Nesta área"}
                <span aria-hidden>✕</span>
              </button>
            )}

            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Ordenar:</span>
              <select
                value={search.ordenacao ?? "preco_asc"}
                onChange={(e) => {
                  const v = e.target.value as Ordenacao;
                  patchSearch({ ordenacao: v === "preco_asc" ? undefined : v });
                }}
                className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white text-foreground"
                aria-label="Ordenar resultados"
              >
                {ORDENACOES_UI.map((o) => (
                  <option key={o} value={o}>
                    {ORDENACAO_LABEL[o]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">
            <div className={cn("min-w-0 flex-1", mapaVisivel && "hidden lg:block")}>
              <ResultadosLista
                loading={loading}
                erro={erro}
                pageData={pageData}
                areaAtiva={areaMapaAtiva}
                temFiltros={temFiltros}
                dataIn={search.data_in}
                dataOut={search.data_out}
                adultos={search.adultos}
                criancas={search.criancas}
                onTentarNovamente={onTentarNovamente}
                onLimparArea={limparArea}
                onLimparTudo={limparTudo}
                irParaPagina={irParaPagina}
              />
            </div>

            {mapaVisivel && (
              <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 h-[70vh] lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border">
                {mapaErro && !mapaData ? (
                  <div className="flex h-full items-center justify-center">
                    <ErroMapa onTentarNovamente={onTentarNovamente} />
                  </div>
                ) : !montado || (mapaLoading && !mapaData) ? (
                  <MapaSkeleton />
                ) : mapaData ? (
                  // Mantido montado entre refetches (ex.: pan do mapa) — trocar por
                  // <MapaSkeleton /> aqui recriaria o Leaflet do zero a cada busca,
                  // e o usuário veria o mapa "reiniciar" com zoom a cada movimento.
                  <Suspense fallback={<MapaSkeleton />}>
                    <MapView
                      items={mapaData.items}
                      dataIn={search.data_in}
                      dataOut={search.data_out}
                      adultos={search.adultos}
                      criancas={search.criancas}
                      areaAtiva={areaMapaAtiva}
                      onBoundsChange={handleBoundsChange}
                      onPertoDeMim={handlePertoDeMim}
                      centroFoco={centroFoco}
                    />
                  </Suspense>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <button
        type="button"
        onClick={toggleMapa}
        className="lg:hidden fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg"
      >
        {mapaVisivel ? (
          <>
            <List className="h-4 w-4" /> Ver lista
          </>
        ) : (
          <>
            <MapIcon className="h-4 w-4" /> Ver mapa
          </>
        )}
      </button>

      <FiltrosModal
        open={filtrosAbertos}
        onOpenChange={setFiltrosAbertos}
        aplicados={search}
        tipoAtivo={tipoAtivo}
        onSelectTipo={(tipo) => patchSearch({ tipos: tipo })}
        onAplicar={(patch) => patchSearch(patch)}
        onSalvarPadrao={user ? () => void salvarComoPadrao() : undefined}
        salvandoPadrao={salvandoPadrao}
      />
    </div>
  );
}

function MapaSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-azul-claro/40">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando o mapa…
      </span>
    </div>
  );
}

function ErroMapa({ onTentarNovamente }: { onTentarNovamente: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar o mapa. Verifique sua conexão.
      </p>
      <Button variant="outline" className="mt-4" onClick={onTentarNovamente}>
        Tentar novamente
      </Button>
    </div>
  );
}
