import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/minha-conta")({
  component: MinhaContaLayout,
});

function MinhaContaLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user)
    return (
      <div className="container mx-auto p-12 text-center text-muted-foreground">Carregando...</div>
    );

  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const nome = meta.nome_responsavel ?? user.email?.split("@")[0] ?? "Família";
  const inicial = nome.trim().charAt(0).toUpperCase();
  const email = user.email ?? "";

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      {/* Top bar mobile */}
      <div className="lg:hidden mb-4 flex items-center justify-between bg-card border rounded-2xl p-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar inicial={inicial} />
          <div className="min-w-0">
            <div className="font-semibold text-sm text-primary truncate">{nome}</div>
            <div className="text-xs text-muted-foreground truncate">{email}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu da conta"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
        {/* Sidebar */}
        <aside
          className={`${mobileOpen ? "block" : "hidden"} lg:block`}
          onClick={() => setMobileOpen(false)}
        >
          <div className="bg-card border rounded-2xl p-3 sticky top-20 space-y-3">
            {/* Cabeçalho de usuário (desktop) */}
            <div className="hidden lg:flex items-center gap-3 px-2 py-2">
              <Avatar inicial={inicial} />
              <div className="min-w-0">
                <div className="font-semibold text-sm text-primary truncate">{nome}</div>
                <div className="text-xs text-muted-foreground truncate">{email}</div>
              </div>
            </div>

            <nav className="space-y-0.5">
              <NavItem
                to="/minha-conta"
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Minha conta"
                exact
              />
              <NavItem
                to="/minha-conta/perfis"
                icon={<Users className="h-4 w-4" />}
                label="Perfis sensoriais"
              />
              <NavItem
                to="/minha-conta/reservas"
                icon={<CalendarCheck className="h-4 w-4" />}
                label="Minhas reservas"
              />
              <NavItem
                to="/minha-conta/avaliacoes"
                icon={<Star className="h-4 w-4" />}
                label="Minhas avaliações"
              />
              <NavItem
                to="/minha-conta/configuracoes"
                icon={<Settings className="h-4 w-4" />}
                label="Configurações"
              />
            </nav>

            <div className="border-t pt-2">
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl text-destructive hover:bg-destructive/10 transition"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function Avatar({ inicial }: { inicial: string }) {
  return (
    <div className="h-10 w-10 rounded-full bg-secondary text-white flex items-center justify-center font-display font-bold shrink-0">
      {inicial}
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
