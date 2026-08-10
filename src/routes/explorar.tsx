import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { List, Loader2, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/explorar/SearchBar";
import { BarraFiltros } from "@/components/explorar/BarraFiltros";
import { ChipsAtivos } from "@/components/explorar/ChipsAtivos";
import { ContagemResultados, ResultadosLista } from "@/components/explorar/ResultadosLista";
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
  buscaSoDeHospedagem,
  csvOrUndefined,
  limparAreaMapa,
  limparFiltrosDeHospedagem,
  parseRecursosCsv,
  parseSelosCsv,
  parseTiposCsv,
  searchToFilters,
  temAreaMapa,
  temFiltrosRelevantes,
  validateExplorarSearch,
  type ExplorarSearch,
} from "@/lib/explorar-search";
import type { EstabTipo } from "@/lib/enums";
import type { BoundsSimples } from "@/components/explorar/MapView";

const MapView = lazy(() =>
  import("@/components/explorar/MapView").then((m) => ({ default: m.MapView })),
);

export const Route = createFileRoute("/explorar")({
  validateSearch: validateExplorarSearch,
  head: () => ({
    meta: [
      { title: "Explorar · Turismo Azul" },
      {
        name: "description",
        content:
          "Encontre hospedagem, restaurantes, parques e passeios preparados para receber famílias TEA.",
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
        toast.error("Não foi possível carregar os resultados.");
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

  /**
   * Troca de categoria pelas pills. Sair de hospedagem leva junto os filtros
   * que só existem lá (preço por noite, período, hóspedes): eles somem do
   * painel, e deixá-los aplicados na URL esconderia resultados por um motivo
   * que a família não teria mais como ver nem desfazer.
   */
  const selecionarTipo = (tipo?: EstabTipo) => {
    const novos = parseTiposCsv(tipo);
    patchSearch({
      tipos: tipo,
      ...(buscaSoDeHospedagem(novos) ? {} : limparFiltrosDeHospedagem()),
    });
  };
  const temFiltros = temFiltrosRelevantes(search);

  const mostrarDicaSelo =
    (pageData?.total ?? 0) > 1 && !parseSelosCsv(search.selos).includes("selo_azul");

  const centroFoco =
    search.centro_lat !== undefined && search.centro_lng !== undefined
      ? { lat: search.centro_lat, lng: search.centro_lng }
      : undefined;

  const onTentarNovamente = () => setTentativa((t) => t + 1);

  return (
    <div className="flex-1 bg-white">
      <div className="container mx-auto px-4 pt-6 pb-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">
          Explorar destinos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lugares preparados para receber famílias TEA.
        </p>

        <div className="mt-4">
          <SearchBar
            valor={search.busca ?? ""}
            onBuscar={(termo) => patchSearch({ busca: termo || undefined })}
          />
        </div>
      </div>

      <BarraFiltros
        search={search}
        tipoAtivo={tipoAtivo}
        onSelectTipo={selecionarTipo}
        onPatch={patchSearch}
        onSalvarPadrao={user ? () => void salvarComoPadrao() : undefined}
        salvandoPadrao={salvandoPadrao}
      />

      <div className="container mx-auto px-4 pt-4 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <ContagemResultados loading={loading} pageData={pageData} areaAtiva={areaMapaAtiva} />
            {mostrarDicaSelo && (
              <span className="text-xs text-muted-foreground">
                · Locais com Selo Azul aparecem primeiro
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={mapaVisivel ? "default" : "outline"}
              size="sm"
              onClick={toggleMapa}
              className="hidden lg:inline-flex"
            >
              <MapIcon className="h-4 w-4 mr-1.5" />
              {mapaVisivel ? "Ocultar mapa" : "Mostrar mapa"}
            </Button>

            <Select
              value={search.ordenacao ?? "preco_asc"}
              onValueChange={(v) =>
                patchSearch({ ordenacao: v === "preco_asc" ? undefined : (v as Ordenacao) })
              }
            >
              <SelectTrigger className="h-9 w-[11.5rem] bg-white" aria-label="Ordenar resultados">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDENACOES_UI.map((o) => (
                  <SelectItem key={o} value={o}>
                    {ORDENACAO_LABEL[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ChipsAtivos
          className="mt-3"
          search={search}
          areaAtiva={areaMapaAtiva}
          onPatch={patchSearch}
          onRemoverTipo={() => selecionarTipo(undefined)}
          onLimparArea={limparArea}
          onLimparTudo={limparTudo}
        />

        <div className="mt-5 flex flex-col lg:flex-row gap-6 items-start">
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
            <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 h-[70vh] lg:sticky lg:top-[12rem] lg:h-[calc(100vh-13rem)] overflow-hidden rounded-2xl border">
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
