import { useState } from "react";
import { Compass, Loader2, MapPinOff, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard, type VarianteCard } from "@/components/explorar/ItemCard";
import { ExplorarPagination } from "@/components/explorar/ExplorarPagination";
import { criarContatoGeral, type ItensViewPage } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface ResultadosListaProps {
  loading: boolean;
  atualizando?: boolean;
  erro: boolean;
  pageData: ItensViewPage | null;
  areaAtiva: boolean;
  temFiltros: boolean;
  visualizacao: VarianteCard;
  mapaVisivel: boolean;
  dataIn?: string;
  dataOut?: string;
  adultos?: number;
  criancas?: number;
  itemAtivoId?: string | null;
  onItemAtivo?: (id: string | null) => void;
  onTentarNovamente: () => void;
  onLimparArea: () => void;
  onLimparTudo: () => void;
  irParaPagina: (pagina: number) => void;
}

function classesGrade(visualizacao: VarianteCard, mapaVisivel: boolean): string {
  if (visualizacao === "lista") return "flex flex-col gap-4";
  return cn(
    "grid gap-5",
    mapaVisivel
      ? "grid-cols-1 xl:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  );
}

export function ResultadosLista({
  loading,
  atualizando = false,
  erro,
  pageData,
  areaAtiva,
  temFiltros,
  visualizacao,
  mapaVisivel,
  dataIn,
  dataOut,
  adultos,
  criancas,
  itemAtivoId,
  onItemAtivo,
  onTentarNovamente,
  onLimparArea,
  onLimparTudo,
  irParaPagina,
}: ResultadosListaProps) {
  return (
    <div>
      <div
        aria-busy={atualizando}
        className={cn("transition-opacity duration-150", atualizando && "opacity-60")}
      >
        {erro && !pageData ? (
          <ErroBusca onTentarNovamente={onTentarNovamente} />
        ) : loading && !pageData ? (
          <GradeSkeleton visualizacao={visualizacao} mapaVisivel={mapaVisivel} />
        ) : !pageData || pageData.items.length === 0 ? (
          areaAtiva ? (
            <AreaVaziaEstado onLimparArea={onLimparArea} />
          ) : (
            <EstadoVazio temFiltros={temFiltros} onLimpar={onLimparTudo} />
          )
        ) : (
          <>
            <div className={classesGrade(visualizacao, mapaVisivel)}>
              {pageData.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  variante={visualizacao}
                  dataIn={dataIn}
                  dataOut={dataOut}
                  adultos={adultos}
                  criancas={criancas}
                  ativo={itemAtivoId === item.id}
                  onAtivar={onItemAtivo ? () => onItemAtivo(item.id) : undefined}
                  onDesativar={onItemAtivo ? () => onItemAtivo(null) : undefined}
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
  );
}

interface ContagemResultadosProps {
  loading: boolean;
  pageData: ItensViewPage | null;
  areaAtiva: boolean;
}

export function ContagemResultados({ loading, pageData, areaAtiva }: ContagemResultadosProps) {
  const total = pageData?.total ?? 0;

  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      {loading && !pageData ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
        </span>
      ) : total > 0 ? (
        <>
          <strong className="text-foreground">{total}</strong> opç{total === 1 ? "ão" : "ões"}{" "}
          {areaAtiva ? "dentro da área do mapa" : "encontrad" + (total === 1 ? "a" : "as")}
        </>
      ) : (
        "Nenhuma opção encontrada"
      )}
    </p>
  );
}

function GradeSkeleton({
  visualizacao,
  mapaVisivel,
}: {
  visualizacao: VarianteCard;
  mapaVisivel: boolean;
}) {
  const ehLista = visualizacao === "lista";
  return (
    <div className={classesGrade(visualizacao, mapaVisivel)}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={cn("overflow-hidden rounded-2xl border", ehLista && "sm:flex")}>
          <Skeleton
            className={cn(
              "aspect-[16/10] w-full rounded-none sm:aspect-[4/3]",
              ehLista && "sm:w-60 sm:shrink-0",
            )}
          />
          <div className="flex-1 space-y-2 p-4">
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
        Não foi possível carregar os resultados. Verifique sua conexão.
      </p>
      <Button variant="outline" className="mt-4" onClick={onTentarNovamente}>
        Tentar novamente
      </Button>
    </div>
  );
}

function AreaVaziaEstado({ onLimparArea }: { onLimparArea: () => void }) {
  return (
    <div className="bg-azul-claro/40 border rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <MapPinOff className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-xl font-display font-bold text-primary">
        Não há acomodações nesta região.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Mova o mapa para outra área ou volte a ver todos os resultados.
      </p>
      <Button variant="outline" className="mt-4" onClick={onLimparArea}>
        Mostrar acomodações
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
          ? "Nenhuma opção encontrada com esses filtros."
          : "Ainda não temos lugares cadastrados."}
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
