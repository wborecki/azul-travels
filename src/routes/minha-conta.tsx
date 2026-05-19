import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Loader2, HeartPulse, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-turismo-azul.svg";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [{ title: "Minha conta · Turismo Azul" }],
  }),
  component: MinhaContaLayout,
});

function MinhaContaLayout() {
  const { user, loading, signOut } = useAuth();
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
    supabase
      .from("familia_profiles")
      .select("nome_responsavel")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setNome(
          data?.nome_responsavel ??
            (user.user_metadata?.nome_responsavel as string | undefined) ??
            user.email?.split("@")[0] ??
            null,
        );
      });
    supabase
      .from("perfil_sensorial")
      .select("id")
      .eq("familia_id", user.id)
      .maybeSingle()
      .then(({ data }) => setPerfilCompleto(!!data));
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
    <div className="flex flex-1 flex-col bg-azul-claro/20">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/minha-conta" className="flex items-center gap-3">
            <img src={logo} alt="Turismo Azul" className="h-8 w-auto" />
            <span className="hidden sm:inline text-sm text-foreground/80">
              Olá, <strong className="text-primary">{primeiroNome || "família"}</strong>
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <NavLink to="/minha-conta" exact label="Meu Perfil" />
            <NavLink to="/minha-conta/perfil" label="Perfil do Meu Filho" />
            <button
              onClick={() => void signOut().then(() => navigate({ to: "/" }))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </nav>
        </div>
      </header>
      {perfilCompleto === false && !pathname.startsWith("/minha-conta/perfil") && (
        <div className="bg-secondary/10 border-b border-secondary/30">
          <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-9 w-9 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                <HeartPulse className="h-5 w-5" />
              </div>
              <p className="text-foreground/80">
                <strong className="text-primary">Complete o perfil sensorial</strong> do seu filho para receber recomendações personalizadas.
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
      <Footer />
    </div>
  );
}

function NavLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
      activeProps={{ className: "bg-azul-claro text-primary font-semibold" }}
    >
      {label}
    </Link>
  );
}
