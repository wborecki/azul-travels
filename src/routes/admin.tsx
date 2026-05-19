import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
// supabase import removed (using user metadata for admin name)
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
  LogOut,
  KeyRound,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/familias": "Famílias TEA",
  "/admin/estabelecimentos": "Estabelecimentos",
  "/admin/administradores": "Administradores",
  "/admin/reservas": "Reservas",
  "/admin/conteudo": "Conteúdo TEA",
  "/admin/usuarios": "Configurações",
  "/admin/auditoria": "Auditoria",
  "/admin/password-resets": "Resets de senha",
};

function AdminLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [adminName, setAdminName] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fromMeta =
      (typeof meta.nome_completo === "string" && meta.nome_completo) ||
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      "";
    setAdminName(fromMeta || user.email || "");
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando...
      </div>
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

  // Determine current page title
  let pageTitle = "Admin";
  const sortedPaths = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length);
  for (const p of sortedPaths) {
    if (pathname === p || pathname.startsWith(p + "/")) {
      pageTitle = PAGE_TITLES[p];
      break;
    }
  }

  const initial = (adminName || user.email || "?").trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <aside
        className="shrink-0 bg-[#1a2f5e] text-white flex flex-col sticky top-0 h-screen"
        style={{ width: 220 }}
      >
        <div className="px-6 py-6 flex justify-center">
          <Logo variant="dark" showTagline={false} />
        </div>
        <div className="border-t border-white/10 mx-4" />
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem to="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" exact />
          <NavItem to="/admin/familias" icon={<Users className="h-4 w-4" />} label="Famílias TEA" />
          <NavItem to="/admin/estabelecimentos" icon={<Building2 className="h-4 w-4" />} label="Estabelecimentos" />
          <NavItem to="/admin/administradores" icon={<Crown className="h-4 w-4" />} label="Administradores" />

          <div className="pt-5 mt-3">
            <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
              Operação
            </div>
            <NavItem to="/admin/reservas" icon={<CalendarCheck className="h-4 w-4" />} label="Reservas" />
            <NavItem to="/admin/conteudo" icon={<FileText className="h-4 w-4" />} label="Conteúdo TEA" />
            <NavItem to="/admin/usuarios" icon={<Settings className="h-4 w-4" />} label="Configurações" />
            <NavItem to="/admin/auditoria" icon={<History className="h-4 w-4" />} label="Auditoria" />
          </div>
        </nav>
        <div className="px-4 py-3 text-[10px] text-white/30 border-t border-white/5">
          v0.1 · Beta
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="bg-white border-b border-[#e5e7eb] flex items-center justify-between px-6 sticky top-0 z-10"
          style={{ height: 48 }}
        >
          <h1 className="text-sm font-bold text-[#1a2f5e]">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/80 hidden sm:inline">{adminName}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2f5e] text-white text-xs font-semibold">
              {initial}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70 hover:text-foreground border border-[#e5e7eb] rounded-md px-2.5 py-1.5 hover:bg-[#f8fafc] transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
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
      className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
      activeProps={{ className: "!bg-[#2563eb] !text-white font-semibold" }}
    >
      {icon} {label}
    </Link>
  );
}
