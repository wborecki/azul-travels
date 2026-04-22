import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Building2, CalendarCheck, FileText, ShieldAlert, History } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-12 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <div className="bg-card border rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é exclusiva para administradores do Turismo Azul.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/minha-conta"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Ir para minha conta
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[240px_1fr] gap-8">
      <aside>
        <div className="bg-card border rounded-2xl p-2 sticky top-20">
          <div className="px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Painel admin
          </div>
          <NavItem
            to="/admin"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Visão geral"
            exact
          />
          <NavItem
            to="/admin/estabelecimentos"
            icon={<Building2 className="h-4 w-4" />}
            label="Estabelecimentos"
          />
          <NavItem
            to="/admin/reservas"
            icon={<CalendarCheck className="h-4 w-4" />}
            label="Reservas"
          />
          <NavItem
            to="/admin/conteudo"
            icon={<FileText className="h-4 w-4" />}
            label="Conteúdo TEA"
          />
          <NavItem
            to="/admin/auditoria"
            icon={<History className="h-4 w-4" />}
            label="Auditoria"
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
