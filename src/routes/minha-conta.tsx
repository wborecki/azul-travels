import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Loader2 } from "lucide-react";
import logo from "@/assets/logo-turismo-azul.png";

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
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  const primeiroNome = nome?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-azul-claro/20">
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
