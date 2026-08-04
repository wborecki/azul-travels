import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchEstabelecimentoDoOwner,
  fetchItemReservavelPorId,
  type EstabelecimentoDoOwner,
  type ItemReservavel,
} from "@/lib/queries";
import { ItemReservavelFormulario } from "@/components/estabelecimento/ItemReservavelFormulario";
import { naturezaDaReserva } from "@/lib/enums";

export const Route = createFileRoute("/meu-estabelecimento/itens/$id")({
  head: () => ({ meta: [{ title: "Editar quarto · Turismo Azul" }] }),
  component: EditarItemPage,
});

function EditarItemPage() {
  const { id } = Route.useParams();
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [carregando, setCarregando] = useState(true);
  const [estab, setEstab] = useState<EstabelecimentoDoOwner | null>(null);
  const [item, setItem] = useState<ItemReservavel | null>(null);

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
      if (naturezaDaReserva(estabRow.tipo) !== "estadia") {
        toast.error("Seu tipo de estabelecimento recebe reservas direto, sem cadastrar quartos.");
        navigate({ to: "/meu-estabelecimento" });
        return;
      }
      setEstab(estabRow);

      try {
        const data = await fetchItemReservavelPorId(id);
        if (!data || data.estabelecimento_id !== estabRow.id) {
          toast.error("Quarto não encontrado.");
          navigate({ to: "/meu-estabelecimento/itens" });
          return;
        }
        setItem(data);
      } catch (err) {
        toast.error("Erro ao carregar quarto", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setCarregando(false);
      }
    })();
  }, [user, loading, role, pathname, navigate, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
      {carregando || !estab ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      ) : !item ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
          <p>Quarto não encontrado.</p>
          <Button asChild>
            <Link to="/meu-estabelecimento/itens">Voltar</Link>
          </Button>
        </div>
      ) : (
        <ItemReservavelFormulario estabId={estab.id} estabEndereco={estab} itemExistente={item} />
      )}
    </main>
  );
}
