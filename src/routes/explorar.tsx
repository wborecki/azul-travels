import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, Loader2, Map as MapIcon, Rows3 } from "lucide-react";
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
import { TrilhoSeloAzul } from "@/components/explorar/TrilhoSeloAzul";
import type { VarianteCard } from "@/components/explorar/ItemCard";
import { useAuth } from "@/hooks/useAuth";
import { useItensViewMapa, useItensViewPagina, useItensViewTotal } from "@/hooks/useItensView";
import { usePerfisCompatibilidade } from "@/hooks/usePerfisCompatibilidade";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { comportamentoRolagem } from "@/lib/movimento";
import { cn } from "@/lib/utils";
import {
  fetchFiltrosPadrao,
  salvarFiltrosPadrao,
  temFiltrosSalvos,
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

  const [salvandoPadrao, setSalvandoPadrao] = useState(false);
  const [visualizacao, setVisualizacao] = useState<VarianteCard>("grade");
  const [itemAtivoId, setItemAtivoId] = useState<string | null>(null);

  const areaMapaAtiva = temAreaMapa(search);
  const mapaVisivel = search.mapa === true;
  const ehDesktop = useMediaQuery("(min-width: 1024px)");

  const perfis = usePerfisCompatibilidade(search);
  const nomesPerfis = perfis.selecionados.map((p) => p.nome_autista).join(" e ");

  const filtros = useMemo(
    () => searchToFilters(search, perfis.necessidades),
    [search, perfis.necessidades],
  );

  const consultaLista = useItensViewPagina(filtros);
  const consultaMapa = useItensViewMapa(filtros, mapaVisivel);

  // Quantos atendem TUDO, dentro dos demais filtros. Vira o atalho "mostrar só
  // esses" - sem isso a família só descobre o recorte aplicando e desfazendo.
  const filtrosCompativeis = useMemo(
    () => searchToFilters({ ...search, so_compativeis: true }, perfis.necessidades),
    [search, perfis.necessidades],
  );
  const podeSugerirRecorte =
    perfis.necessidades.length > 0 && !search.so_compativeis && !mapaVisivel;
  const consultaCompativeis = useItensViewTotal(filtrosCompativeis, podeSugerirRecorte);
  const totalCompativeis = consultaCompativeis.data ?? null;

  const pageData = consultaLista.data ?? null;
  const loading = consultaLista.isFetching;
  const erro = consultaLista.isError;

  const mapaData = consultaMapa.data ?? null;
  const mapaErro = consultaMapa.isError;

  function escolherVisualizacao(nova: VarianteCard) {
    setVisualizacao(nova);
    if (mapaVisivel) patchSearch({ mapa: undefined });
  }

  function selecionarItemDoMapa(id: string) {
    setItemAtivoId(id);
    if (!ehDesktop) return;
    document
      .querySelector(`[data-item-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ behavior: comportamentoRolagem(), block: "center" });
  }

  function handleBoundsChange(bounds: BoundsSimples) {
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
    if (!mapaVisivel || ehDesktop) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [mapaVisivel, ehDesktop]);

  useEffect(() => {
    if (!erro) return;
    console.error(consultaLista.error);
    toast.error("Não foi possível carregar os resultados.");
  }, [erro, consultaLista.error]);

  useEffect(() => {
    if (!mapaErro) return;
    console.error(consultaMapa.error);
    toast.error("Não foi possível carregar o mapa.");
  }, [mapaErro, consultaMapa.error]);

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
    window.scrollTo({ top: 0, behavior: comportamentoRolagem() });
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

  const selecionarTipo = (tipo?: EstabTipo) => {
    const novos = parseTiposCsv(tipo);
    patchSearch({
      tipos: tipo,
      ...(buscaSoDeHospedagem(novos) ? {} : limparFiltrosDeHospedagem()),
    });
  };
  const temFiltros = temFiltrosRelevantes(search);

  const semFiltroDeSelo = !parseSelosCsv(search.selos).includes("selo_azul");
  const mostrarDicaSelo = (pageData?.total ?? 0) > 1 && semFiltroDeSelo;
  const mostrarTrilhoSelo = semFiltroDeSelo && !areaMapaAtiva && !!pageData;

  const centroFoco =
    search.centro_lat !== undefined && search.centro_lng !== undefined
      ? { lat: search.centro_lat, lng: search.centro_lng }
      : undefined;

  const onTentarNovamente = () => {
    void consultaLista.refetch();
    if (mapaVisivel) void consultaMapa.refetch();
  };

  const conteudoLista = (
    <>
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
          <div
            role="group"
            aria-label="Formato dos resultados"
            className="inline-flex items-center gap-0.5 rounded-full border border-border bg-white p-0.5"
          >
            <BotaoVisualizacao
              ativo={!mapaVisivel && visualizacao === "grade"}
              rotulo="Grade"
              onClick={() => escolherVisualizacao("grade")}
            >
              <LayoutGrid className="h-4 w-4" />
            </BotaoVisualizacao>
            <BotaoVisualizacao
              ativo={!mapaVisivel && visualizacao === "lista"}
              rotulo="Lista"
              className="hidden sm:inline-flex"
              onClick={() => escolherVisualizacao("lista")}
            >
              <Rows3 className="h-4 w-4" />
            </BotaoVisualizacao>
            <BotaoVisualizacao
              ativo={mapaVisivel}
              rotulo="Mapa"
              onClick={() => patchSearch({ mapa: true })}
            >
              <MapIcon className="h-4 w-4" />
            </BotaoVisualizacao>
          </div>

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
        perfisSelecionados={perfis.selecionados}
        areaAtiva={areaMapaAtiva}
        onPatch={patchSearch}
        onRemoverTipo={() => selecionarTipo(undefined)}
        onLimparArea={limparArea}
        onLimparTudo={limparTudo}
      />

      {podeSugerirRecorte && totalCompativeis !== null && (pageData?.total ?? 0) > 0 && (
        <p className="mt-3 text-sm text-foreground/80">
          {totalCompativeis === 0 ? (
            <>
              Nenhuma opção atende tudo que {nomesPerfis} precisa — a nota em cada card mostra o
              quanto chega perto.
            </>
          ) : (
            <>
              <strong className="text-primary">{totalCompativeis}</strong> de {pageData?.total}{" "}
              atendem tudo que {nomesPerfis} precisa.{" "}
              <button
                type="button"
                onClick={() => patchSearch({ so_compativeis: true })}
                className="font-semibold text-secondary underline underline-offset-2"
              >
                Mostrar só essas
              </button>
            </>
          )}
        </p>
      )}

      <div className="mt-5">
        {mostrarTrilhoSelo && (
          <TrilhoSeloAzul
            search={search}
            totalResultados={pageData?.total ?? 0}
            onVerTodos={() =>
              patchSearch({
                selos: csvOrUndefined([...parseSelosCsv(search.selos), "selo_azul"]),
              })
            }
          />
        )}

        <ResultadosLista
          loading={loading}
          atualizando={consultaLista.isPlaceholderData && consultaLista.isFetching}
          erro={erro}
          pageData={pageData}
          areaAtiva={areaMapaAtiva}
          temFiltros={temFiltros}
          visualizacao={visualizacao}
          mapaVisivel={mapaVisivel}
          dataIn={search.data_in}
          dataOut={search.data_out}
          adultos={search.adultos}
          criancas={search.criancas}
          itemAtivoId={itemAtivoId}
          necessidades={perfis.necessidades}
          nomesPerfis={nomesPerfis}
          onItemAtivo={setItemAtivoId}
          onTentarNovamente={onTentarNovamente}
          onLimparArea={limparArea}
          onLimparTudo={limparTudo}
          irParaPagina={irParaPagina}
        />
      </div>
    </>
  );

  const painelMapa = (
    <div
      className={cn(
        "overflow-hidden",
        ehDesktop
          ? "sticky top-[11.5rem] h-[calc(100dvh-11.5rem)] self-start border-l border-border"
          : "fixed inset-0 z-50 bg-white",
      )}
    >
      {mapaErro && !mapaData ? (
        <div className="flex h-full items-center justify-center">
          <ErroMapa onTentarNovamente={onTentarNovamente} />
        </div>
      ) : !montado || !mapaData ? (
        <MapaSkeleton />
      ) : (
        <Suspense fallback={<MapaSkeleton />}>
          <MapView
            items={mapaData.items}
            dataIn={search.data_in}
            dataOut={search.data_out}
            adultos={search.adultos}
            criancas={search.criancas}
            areaAtiva={areaMapaAtiva}
            truncado={mapaData.truncado}
            total={mapaData.total}
            itemAtivoId={itemAtivoId}
            onItemAtivo={setItemAtivoId}
            onSelecionarItem={selecionarItemDoMapa}
            onBoundsChange={handleBoundsChange}
            onPertoDeMim={handlePertoDeMim}
            centroFoco={centroFoco}
            onFechar={() => patchSearch({ mapa: undefined })}
          />
        </Suspense>
      )}
    </div>
  );

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
        perfisDisponiveis={perfis.disponiveis}
        perfisSelecionados={perfis.selecionados}
        necessidades={perfis.necessidades}
        carregandoPerfis={perfis.carregando}
      />

      {mapaVisivel ? (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_46%]">
          <div className="hidden min-w-0 pb-16 pt-4 lg:block lg:pl-8 lg:pr-6">{conteudoLista}</div>
          {painelMapa}
        </div>
      ) : (
        <div className="container mx-auto px-4 pt-4 pb-16">{conteudoLista}</div>
      )}
    </div>
  );
}

interface BotaoVisualizacaoProps {
  ativo: boolean;
  rotulo: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

function BotaoVisualizacao({
  ativo,
  rotulo,
  onClick,
  className,
  children,
}: BotaoVisualizacaoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
        ativo ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-primary",
        className,
      )}
    >
      {children}
    </button>
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
