import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Compass, Loader2, SearchX, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchBar } from "@/components/explorar/SearchBar";
import { CategoryPills } from "@/components/explorar/CategoryPills";
import { FilterPanel } from "@/components/explorar/FilterPanel";
import { ItemCard } from "@/components/explorar/ItemCard";
import { ExplorarPagination } from "@/components/explorar/ExplorarPagination";
import { useAuth } from "@/hooks/useAuth";
import {
  criarContatoGeral,
  fetchItensViewPaginated,
  fetchFiltrosPadrao,
  salvarFiltrosPadrao,
  temFiltrosSalvos,
  type ItensViewPage,
  type Ordenacao,
} from "@/lib/queries";
import {
  ORDENACAO_LABEL,
  contarFiltrosAtivos,
  csvOrUndefined,
  parseRecursosCsv,
  parseSelosCsv,
  parseTiposCsv,
  searchToFilters,
  temFiltrosRelevantes,
  validateExplorarSearch,
  type ExplorarSearch,
} from "@/lib/explorar-search";

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
  const [sheetAberto, setSheetAberto] = useState(false);
  const [salvandoPadrao, setSalvandoPadrao] = useState(false);

  // Busca paginada no servidor - a URL é a única fonte dos filtros.
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

  // URL apontando para página além da última (link antigo/compartilhado):
  // corrige silenciosamente para a última página válida.
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

  // Entrada "limpa" de usuário logado: reaplica os filtros salvos como padrão.
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
            // Usuário pode ter interagido enquanto o fetch corria - não sobrescreve.
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
      .catch(() => {
        // Silencioso: preferências salvas nunca bloqueiam a busca.
      });
  }, [authLoading, user, search, navigate]);

  /** Aplica um patch de filtros e volta para a página 1. */
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
  const filtrosAtivos = contarFiltrosAtivos(search);
  const temFiltros = temFiltrosRelevantes(search);

  const total = pageData?.total ?? 0;
  const exibindoDe = pageData && total > 0 ? (pageData.pagina - 1) * pageData.tamanhoPagina + 1 : 0;
  const exibindoAte = pageData ? Math.min(total, pageData.pagina * pageData.tamanhoPagina) : 0;

  const painelFiltros = (
    <FilterPanel
      aplicados={search}
      onAplicar={(patch) => {
        patchSearch(patch);
        setSheetAberto(false);
      }}
      onSalvarPadrao={user ? () => void salvarComoPadrao() : undefined}
      salvandoPadrao={salvandoPadrao}
    />
  );

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

          <div className="mt-4">
            <CategoryPills
              tipoAtivo={tipoAtivo}
              onSelect={(tipo) => patchSearch({ tipos: tipo })}
            />
          </div>

          <div className="mt-6 flex gap-8 items-start">
            {/* Filtros - sidebar fixa no desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 rounded-xl border bg-white p-4">
                {painelFiltros}
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {/* Barra de resultados: contagem, filtros (mobile) e ordenação */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Buscando quartos…
                    </span>
                  ) : total > 0 ? (
                    <>
                      Mostrando <strong>{exibindoDe}</strong>–<strong>{exibindoAte}</strong> de{" "}
                      <strong>{total}</strong> quarto{total === 1 ? "" : "s"}
                    </>
                  ) : (
                    "Nenhum quarto encontrado"
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                        Filtros
                        {filtrosAtivos > 0 && (
                          <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                            {filtrosAtivos}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[320px] sm:w-[380px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filtros</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">{painelFiltros}</div>
                    </SheetContent>
                  </Sheet>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
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
              </div>

              {/* Resultados */}
              <div className="mt-4">
                {loading ? (
                  <GradeSkeleton />
                ) : erro ? (
                  <ErroBusca onTentarNovamente={() => setTentativa((t) => t + 1)} />
                ) : !pageData || pageData.items.length === 0 ? (
                  <EstadoVazio temFiltros={temFiltros} onLimpar={limparTudo} />
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {pageData.items.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          dataIn={search.data_in}
                          dataOut={search.data_out}
                          adultos={search.adultos}
                          criancas={search.criancas}
                        />
                      ))}
                    </div>
                    <div className="mt-8">
                      <ExplorarPagination
                        pagina={pageData.pagina}
                        totalPaginas={pageData.totalPaginas}
                        onChange={irParaPagina}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function GradeSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-2xl border overflow-hidden">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErroBusca({ onTentarNovamente }: { onTentarNovamente: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar os quartos. Verifique sua conexão.
      </p>
      <Button variant="outline" className="mt-4" onClick={onTentarNovamente}>
        Tentar novamente
      </Button>
    </div>
  );
}

function EstadoVazio({ temFiltros, onLimpar }: { temFiltros: boolean; onLimpar: () => void }) {
  return (
    <div className="bg-azul-claro/40 border rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {temFiltros ? <SearchX className="h-8 w-8" /> : <Compass className="h-8 w-8" />}
      </div>
      <h2 className="mt-4 text-xl font-display font-bold text-primary">
        {temFiltros
          ? "Nenhum quarto encontrado com esses filtros."
          : "Ainda não temos quartos cadastrados."}
      </h2>
      {temFiltros ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente ampliar a busca removendo alguns filtros.
          </p>
          <Button variant="outline" className="mt-4" onClick={onLimpar}>
            Limpar todos os filtros
          </Button>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Primeiros estabelecimentos chegando em breve.
        </p>
      )}

      <div className="mt-8 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Indique um local que você gostaria de ver aqui →
        </p>
        <FormIndicacao />
      </div>
    </div>
  );
}

function FormIndicacao() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setEnviando(true);
    try {
      await criarContatoGeral({
        nome: nome.trim(),
        email: email.trim(),
        assunto: "Indicação de estabelecimento",
        mensagem: mensagem.trim(),
        origem: "explorar_indicacao",
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    } finally {
      setEnviando(false);
    }
    toast.success("Indicação enviada! Obrigado.");
    setNome("");
    setEmail("");
    setMensagem("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 text-left max-w-md mx-auto">
      <Input
        placeholder="Seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
      />
      <Input
        type="email"
        placeholder="Seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Textarea
        placeholder="Nome e cidade do local que você gostaria de indicar"
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        rows={3}
        required
      />
      <Button
        type="submit"
        disabled={enviando}
        className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando…
          </>
        ) : (
          "Indicar"
        )}
      </Button>
    </form>
  );
}
