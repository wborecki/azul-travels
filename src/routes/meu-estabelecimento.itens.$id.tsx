import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
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
import { EstabelecimentoHeader } from "@/components/estabelecimento/EstabelecimentoHeader";
import { ItemReservavelFormulario } from "@/components/estabelecimento/ItemReservavelFormulario";

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

  if (loading || carregando || !estab) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <p>Quarto não encontrado.</p>
        <Button asChild>
          <Link to="/meu-estabelecimento/itens">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-azul-claro/20 isolate">
      <EstabelecimentoHeader ativa="itens" />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <ItemReservavelFormulario estabId={estab.id} estabEndereco={estab} itemExistente={item} />
      </main>
      <Footer />
    </div>
  );
}
