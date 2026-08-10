import { useState } from "react";
import { Compass, Loader2, MapPinOff, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/components/explorar/ItemCard";
import { ExplorarPagination } from "@/components/explorar/ExplorarPagination";
import { criarContatoGeral, type ItensViewPage } from "@/lib/queries";

interface ResultadosListaProps {
  loading: boolean;
  erro: boolean;
  pageData: ItensViewPage | null;
  areaAtiva: boolean;
  temFiltros: boolean;
  dataIn?: string;
  dataOut?: string;
  adultos?: number;
  criancas?: number;
  onTentarNovamente: () => void;
  onLimparArea: () => void;
  onLimparTudo: () => void;
  irParaPagina: (pagina: number) => void;
}

export function ResultadosLista({
  loading,
  erro,
  pageData,
  areaAtiva,
  temFiltros,
  dataIn,
  dataOut,
  adultos,
  criancas,
  onTentarNovamente,
  onLimparArea,
  onLimparTudo,
  irParaPagina,
}: ResultadosListaProps) {
  return (
    <div>
      <div>
        {erro && !pageData ? (
          <ErroBusca onTentarNovamente={onTentarNovamente} />
        ) : loading && !pageData ? (
          <GradeSkeleton />
        ) : !pageData || pageData.items.length === 0 ? (
          areaAtiva ? (
            <AreaVaziaEstado onLimparArea={onLimparArea} />
          ) : (
            <EstadoVazio temFiltros={temFiltros} onLimpar={onLimparTudo} />
          )
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-6">
              {pageData.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  dataIn={dataIn}
                  dataOut={dataOut}
                  adultos={adultos}
                  criancas={criancas}
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

function GradeSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
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
        Não foi possível carregar os resultados. Verifique sua conexão.
      </p>
      <Button variant="outline" className="mt-4" onClick={onTentarNovamente}>
        Tentar novamente
      </Button>
    </div>
  );
}

/** Área do mapa (bbox ou "perto de mim") sem resultados — distinto do estado vazio geral. */
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
