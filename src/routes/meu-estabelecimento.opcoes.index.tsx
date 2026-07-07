import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Pause, Play, Trash2, ImageOff, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchEstabelecimentoDoOwner,
  fetchOpcoesDoEstabelecimento,
  atualizarOpcaoReserva,
  excluirOpcaoReserva,
  type OpcaoReserva,
} from "@/lib/queries";
import { EstabelecimentoHeader } from "@/components/estabelecimento/EstabelecimentoHeader";

export const Route = createFileRoute("/meu-estabelecimento/opcoes/")({
  head: () => ({ meta: [{ title: "Quartos · Turismo Azul" }] }),
  component: MeuEstabelecimentoOpcoesPage,
});

function formatPreco(preco: number): string {
  return `${preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / noite`;
}

function mensagemErroExclusao(err: unknown): string | undefined {
  const blob = err instanceof Error ? err.message : "";
  if (blob.includes("OPCAO_COM_RESERVAS_ATIVAS")) {
    return "Este quarto tem reservas em andamento - pause em vez de excluir.";
  }
  return err instanceof Error ? err.message : undefined;
}

function MeuEstabelecimentoOpcoesPage() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [carregando, setCarregando] = useState(true);
  const [opcoes, setOpcoes] = useState<OpcaoReserva[]>([]);
  const [excluir, setExcluir] = useState<OpcaoReserva | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [pausandoId, setPausandoId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: pathname } });
      return;
    }
    if (role && role !== "estabelecimento" && role !== "admin") {
      navigate({ to: "/minha-conta" });
      return;
    }
    void (async () => {
      const estabRow = await fetchEstabelecimentoDoOwner(user.id);

      if (!estabRow || !estabRow.selo_azul || estabRow.status !== "ativo") {
        toast.error("Os quartos ficam disponíveis para locais com Selo Azul ativo.");
        navigate({ to: "/meu-estabelecimento" });
        return;
      }

      try {
        const data = await fetchOpcoesDoEstabelecimento(estabRow.id);
        setOpcoes(data);
      } catch (err) {
        toast.error("Erro ao carregar quartos", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setCarregando(false);
      }
    })();
  }, [user, loading, role, pathname, navigate]);

  const alternarAtivo = async (opcao: OpcaoReserva) => {
    setPausandoId(opcao.id);
    try {
      const atualizada = await atualizarOpcaoReserva(opcao.id, { ativo: !opcao.ativo });
      setOpcoes((ops) => ops.map((o) => (o.id === atualizada.id ? atualizada : o)));
      toast.success(atualizada.ativo ? "Quarto reativado" : "Quarto pausado");
    } catch (err) {
      toast.error("Não foi possível atualizar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPausandoId(null);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluir) return;
    setExcluindo(true);
    try {
      await excluirOpcaoReserva(excluir.id);
      setOpcoes((ops) => ops.filter((o) => o.id !== excluir.id));
      toast.success("Quarto excluído");
      setExcluir(null);
    } catch (err) {
      toast.error("Não foi possível excluir", { description: mensagemErroExclusao(err) });
    } finally {
      setExcluindo(false);
    }
  };

  const ordenadas = useMemo(
    () => opcoes.slice().sort((a, b) => Number(b.ativo) - Number(a.ativo)),
    [opcoes],
  );

  if (loading || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-azul-claro/20 isolate">
      <EstabelecimentoHeader ativa="opcoes" />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-primary">Quartos</h1>
            <p className="text-sm text-foreground/70 mt-1">
              Cada quarto tem suas próprias fotos, comodidades, preço e quantidade - a família
              escolhe um deles ao reservar.
            </p>
          </div>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-white">
            <Link to="/meu-estabelecimento/opcoes/nova">
              <Plus className="h-4 w-4 mr-1.5" /> Novo quarto
            </Link>
          </Button>
        </div>

        {ordenadas.length === 0 ? (
          <div className="bg-white border rounded-2xl p-8 text-center text-foreground/60">
            Nenhum quarto cadastrado ainda. Crie o primeiro para começar a receber reservas.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ordenadas.map((opcao) => {
              const capa = Array.isArray(opcao.imagens) ? (opcao.imagens as string[])[0] : null;
              return (
                <div
                  key={opcao.id}
                  className={cn(
                    "bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col",
                    !opcao.ativo && "opacity-60",
                  )}
                >
                  <div className="h-36 bg-muted flex items-center justify-center">
                    {capa ? (
                      <img src={capa} alt={opcao.nome} className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="h-8 w-8 text-foreground/30" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-foreground">{opcao.nome}</h3>
                      <span
                        className={cn(
                          "text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full shrink-0",
                          opcao.ativo
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {opcao.ativo ? "Ativa" : "Pausada"}
                      </span>
                    </div>
                    {opcao.descricao && (
                      <p className="text-xs text-foreground/60 line-clamp-2">{opcao.descricao}</p>
                    )}
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary">{formatPreco(opcao.preco)}</span>
                      <span className="inline-flex items-center gap-1 text-foreground/60">
                        <Users className="h-3.5 w-3.5" /> {opcao.quantidade}
                      </span>
                    </div>
                    <div className="mt-auto pt-3 flex items-center gap-2">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to="/meu-estabelecimento/opcoes/$id" params={{ id: opcao.id }}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void alternarAtivo(opcao)}
                        disabled={pausandoId === opcao.id}
                        aria-label={opcao.ativo ? "Pausar quarto" : "Reativar quarto"}
                      >
                        {pausandoId === opcao.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : opcao.ativo ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/40 hover:bg-destructive/10"
                        onClick={() => setExcluir(opcao)}
                        aria-label="Excluir quarto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && !excluindo && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{excluir?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Se houver reservas em andamento usando este quarto, a
              exclusão será bloqueada - pause o quarto nesse caso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmarExclusao();
              }}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Excluindo…
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
