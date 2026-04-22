import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Users, CalendarCheck, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/minha-conta")({
  component: MinhaContaLayout,
});

function MinhaContaLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user)
    return (
      <div className="container mx-auto p-12 text-center text-muted-foreground">Carregando...</div>
    );

  return (
    <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[240px_1fr] gap-8">
      <aside>
        <div className="bg-card border rounded-2xl p-2 sticky top-20">
          <NavItem
            to="/minha-conta"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            exact
          />
          <NavItem
            to="/minha-conta/perfil-sensorial"
            icon={<Users className="h-4 w-4" />}
            label="Perfis sensoriais"
          />
          <NavItem
            to="/minha-conta/reservas"
            icon={<CalendarCheck className="h-4 w-4" />}
            label="Minhas reservas"
          />
          <NavItem
            to="/minha-conta/dados"
            icon={<UserIcon className="h-4 w-4" />}
            label="Dados da conta"
          />
        </div>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
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
