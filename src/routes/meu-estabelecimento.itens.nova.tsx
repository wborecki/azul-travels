import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchEstabelecimentoDoOwner, type EstabelecimentoDoOwner } from "@/lib/queries";
import { naturezaDaReserva } from "@/lib/enums";
import { ItemReservavelFormulario } from "@/components/estabelecimento/ItemReservavelFormulario";

export const Route = createFileRoute("/meu-estabelecimento/itens/nova")({
  head: () => ({ meta: [{ title: "Novo quarto · Turismo Azul" }] }),
  component: NovoItemPage,
});

function NovoItemPage() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [carregando, setCarregando] = useState(true);
  const [estab, setEstab] = useState<EstabelecimentoDoOwner | null>(null);

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
      if (!estabRow || estabRow.status !== "ativo") {
        toast.error("Os quartos ficam disponíveis enquanto o local está ativo.");
        navigate({ to: "/meu-estabelecimento" });
        return;
      }
      if (naturezaDaReserva(estabRow.tipo) !== "estadia") {
        toast.error("Seu tipo de estabelecimento recebe reservas direto, sem cadastrar quartos.");
        navigate({ to: "/meu-estabelecimento" });
        return;
      }
      setEstab(estabRow);
      setCarregando(false);
    })();
  }, [user, loading, role, pathname, navigate]);

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
      ) : (
        <ItemReservavelFormulario estabId={estab.id} estabEndereco={estab} />
      )}
    </main>
  );
}
