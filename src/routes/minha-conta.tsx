import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchNomeResponsavelDaFamilia, fetchTemPerfilSensorial } from "@/lib/queries";
import { Loader2, HeartPulse, ArrowRight } from "lucide-react";
import { PainelSubNav } from "@/components/PainelSubNav";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [{ title: "Minha conta · Turismo Azul" }],
  }),
  component: MinhaContaLayout,
});

function MinhaContaLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [nome, setNome] = useState<string | null>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [user, loading, pathname, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchNomeResponsavelDaFamilia(user.id)
      .then((nomeResp) => {
        setNome(
          nomeResp ??
            (user.user_metadata?.nome_responsavel as string | undefined) ??
            user.email?.split("@")[0] ??
            null,
        );
      })
      .catch(() => {});
    fetchTemPerfilSensorial(user.id)
      .then(setPerfilCompleto)
      .catch(() => {});
  }, [user, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  const primeiroNome = nome?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-1 flex-col bg-azul-claro/20 isolate">
      <PainelSubNav
        greeting={
          <>
            Olá, <strong className="text-primary">{primeiroNome || "família"}</strong>
          </>
        }
        tabs={[
          { label: "Meu Perfil", to: "/minha-conta", exact: true },
          { label: "Perfis TEA", to: "/minha-conta/perfil" },
          { label: "Conversas", to: "/minha-conta/mensagens" },
          { label: "Reservas", to: "/minha-conta/reservas" },
        ]}
      />
      {perfilCompleto === false && !pathname.startsWith("/minha-conta/perfil") && (
        <div className="bg-secondary/10 border-b border-secondary/30">
          <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-9 w-9 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                <HeartPulse className="h-5 w-5" />
              </div>
              <p className="text-foreground/80">
                <strong className="text-primary">Complete o Perfil TEA</strong> para receber
                recomendações personalizadas.
              </p>
            </div>
            <Link
              to="/minha-conta/perfil"
              className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shrink-0"
            >
              Completar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
