import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminCounts, fetchDashboardStats, type AdminCounts, type DashboardStats } from "@/lib/queries";
import { Building2, CalendarCheck, FileText, Users, ShieldCheck, Sparkles, ClipboardList, Home } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [counts, setCounts] = useState<AdminCounts | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [c, s] = await Promise.all([fetchAdminCounts(), fetchDashboardStats()]);
        setCounts(c);
        setStats(s);
      } catch (err) {
        toast.error("Erro ao carregar dashboard", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
      setLoading(false);
    })();
  }, []);

  const fmt = (n?: number) => (loading ? "—" : String(n ?? 0));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo do marketplace, contas e métricas-chave.
        </p>
      </header>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Contas e papéis
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            to="/admin/usuarios"
            icon={<Users className="h-5 w-5" />}
            label="Famílias"
            value={fmt(stats?.total_familias)}
          />
          <StatCard
            to="/admin/usuarios"
            icon={<Building2 className="h-5 w-5" />}
            label="Estabelecimentos"
            value={fmt(stats?.total_estabelecimentos)}
          />
          <StatCard
            to="/admin/usuarios"
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Administradores"
            value={fmt(stats?.total_admins)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Engajamento
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={<Sparkles className="h-5 w-5" />}
            label="Novos esta semana"
            value={fmt(stats?.novos_esta_semana)}
            highlight
          />
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            label="Famílias com perfil TEA"
            value={fmt(stats?.familias_com_perfil_tea)}
          />
          <StatCard
            icon={<Home className="h-5 w-5" />}
            label="Estab. com perfil completo"
            value={fmt(stats?.estabelecimentos_com_perfil)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Operação
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            to="/admin/estabelecimentos"
            icon={<Building2 className="h-5 w-5" />}
            label="Estabelecimentos (total)"
            value={fmt(counts?.estabelecimentos)}
          />
          <StatCard
            to="/admin/reservas"
            icon={<CalendarCheck className="h-5 w-5" />}
            label="Reservas pendentes"
            value={fmt(counts?.reservasPendentes)}
            highlight
          />
          <StatCard
            to="/admin/conteudo"
            icon={<FileText className="h-5 w-5" />}
            label="Conteúdos TEA"
            value={fmt(counts?.conteudos)}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Famílias cadastradas"
            value={fmt(counts?.familias)}
          />
        </div>
      </section>

      <section className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-display font-semibold text-foreground">Atalhos rápidos</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ShortcutLink to="/admin/usuarios" label="Gerenciar usuários" />
          <ShortcutLink to="/admin/estabelecimentos" label="Gerenciar estabelecimentos" />
          <ShortcutLink to="/admin/reservas" label="Revisar reservas" />
          <ShortcutLink to="/admin/conteudo" label="Publicar conteúdo" />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  to,
  icon,
  label,
  value,
  highlight,
}: {
  to?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`bg-card border rounded-2xl p-5 transition ${
        to ? "hover:border-primary/40 hover:shadow-sm" : ""
      } ${highlight ? "ring-1 ring-primary/30" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            highlight ? "bg-primary/10 text-primary" : "bg-azul-claro text-primary"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-display font-bold text-foreground">{value}</div>
    </div>
  );
  if (!to) return content;
  return <Link to={to}>{content}</Link>;
}

function ShortcutLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-dashed border-border px-4 py-3 text-sm font-medium text-foreground/80 hover:border-primary hover:text-primary hover:bg-azul-claro transition"
    >
      {label} →
    </Link>
  );
}
