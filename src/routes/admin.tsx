import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  FileText,
  ShieldAlert,
  History,
  Users,
  Crown,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, loading, isAdmin, navigate]);

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
            Esta área é exclusiva para administradores. Redirecionando…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fa]">
      <aside className="w-64 shrink-0 bg-[#1a2f5e] text-white flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <Logo variant="dark" showTagline={false} />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem to="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" exact />
          <NavItem to="/admin/familias" icon={<Users className="h-4 w-4" />} label="Famílias TEA" />
          <NavItem to="/admin/estabelecimentos" icon={<Building2 className="h-4 w-4" />} label="Estabelecimentos" />
          <NavItem to="/admin/administradores" icon={<Crown className="h-4 w-4" />} label="Administradores" />
          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Operação
            </div>
            <NavItem to="/admin/reservas" icon={<CalendarCheck className="h-4 w-4" />} label="Reservas" />
            <NavItem to="/admin/conteudo" icon={<FileText className="h-4 w-4" />} label="Conteúdo TEA" />
            <NavItem to="/admin/usuarios" icon={<Settings className="h-4 w-4" />} label="Configurações" />
            <NavItem to="/admin/auditoria" icon={<History className="h-4 w-4" />} label="Auditoria" />
          </div>
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-8">
        <Outlet />
      </main>
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
      className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-white/75 hover:bg-white/10 hover:text-white transition"
      activeProps={{ className: "bg-white/15 text-white font-semibold" }}
    >
      {icon} {label}
    </Link>
  );
}
