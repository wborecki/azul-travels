import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchEstabelecimentoDoOwner, fetchNomeResponsavelDoEstabelecimento } from "@/lib/queries";
import { PainelSubNav, type PainelTab } from "@/components/PainelSubNav";

export const Route = createFileRoute("/meu-estabelecimento")({
  head: () => ({ meta: [{ title: "Meu estabelecimento · Turismo Azul" }] }),
  component: MeuEstabelecimentoLayout,
});

function MeuEstabelecimentoLayout() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [nome, setNome] = useState<string | null>(null);
  const [operacional, setOperacional] = useState(false);

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
      const [nomeResp, estab] = await Promise.all([
        fetchNomeResponsavelDoEstabelecimento(user.id),
        fetchEstabelecimentoDoOwner(user.id),
      ]);
      setNome(nomeResp ?? user.email?.split("@")[0] ?? null);
      setOperacional(!!estab?.selo_azul && estab.status === "ativo");
    })();
  }, [user, loading, role, pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  const primeiroNome = nome?.split(" ")[0] ?? "";

  const tabs: PainelTab[] = [
    { label: "Meu Estabelecimento", to: "/meu-estabelecimento", exact: true },
    ...(operacional
      ? ([
          { label: "Reservas", to: "/meu-estabelecimento/reservas" },
          { label: "Mensagens", to: "/meu-estabelecimento/mensagens" },
          { label: "Quartos", to: "/meu-estabelecimento/itens" },
        ] satisfies PainelTab[])
      : []),
  ];

  return (
    <div className="flex flex-1 flex-col bg-azul-claro/20 isolate">
      <PainelSubNav
        greeting={
          <>
            Olá, <strong className="text-primary">{primeiroNome || "parceiro"}</strong>
          </>
        }
        tabs={tabs}
      />
      <Outlet />
    </div>
  );
}
