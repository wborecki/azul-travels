import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchEstabelecimentoDoOwner, type EstabelecimentoDoOwner } from "@/lib/queries";
import { EstabelecimentoHeader } from "@/components/estabelecimento/EstabelecimentoHeader";
import { OpcaoReservaFormulario } from "@/components/estabelecimento/OpcaoReservaFormulario";

export const Route = createFileRoute("/meu-estabelecimento/opcoes/nova")({
  head: () => ({ meta: [{ title: "Novo quarto · Turismo Azul" }] }),
  component: NovaOpcaoPage,
});

function NovaOpcaoPage() {
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
      if (!estabRow || !estabRow.selo_azul || estabRow.status !== "ativo") {
        toast.error("Os quartos ficam disponíveis para locais com Selo Azul ativo.");
        navigate({ to: "/meu-estabelecimento" });
        return;
      }
      setEstab(estabRow);
      setCarregando(false);
    })();
  }, [user, loading, role, pathname, navigate]);

  if (loading || carregando || !estab) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-azul-claro/20 isolate">
      <EstabelecimentoHeader ativa="opcoes" />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <OpcaoReservaFormulario estabId={estab.id} estabEndereco={estab} />
      </main>
      <Footer />
    </div>
  );
}
