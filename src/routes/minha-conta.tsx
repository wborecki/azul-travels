import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, User, CalendarCheck, LogOut, Loader2 } from "lucide-react";

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

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [user, loading, pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-azul-claro/20">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12 grid lg:grid-cols-[240px_1fr] gap-6">
        <aside>
          <div className="bg-white border rounded-2xl p-2 sticky top-28">
            <div className="px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Conta da família
            </div>
            <NavItem to="/minha-conta" icon={<LayoutDashboard className="h-4 w-4" />} label="Início" exact />
            <NavItem to="/minha-conta/perfil" icon={<User className="h-4 w-4" />} label="Perfil TEA" />
            <NavItem to="/minha-conta/reservas" icon={<CalendarCheck className="h-4 w-4" />} label="Reservas" />
            <button
              onClick={() => void signOut()}
              className="w-full mt-1 flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
      activeProps={{ className: "bg-azul-claro text-primary font-semibold" }}
    >
      {icon} {label}
    </Link>
  );
}

