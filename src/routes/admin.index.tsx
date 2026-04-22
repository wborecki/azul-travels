import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminCounts, type AdminCounts } from "@/lib/queries";
import { Building2, CalendarCheck, FileText, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Stats = AdminCounts;

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setStats(await fetchAdminCounts());
      } catch (err) {
        toast.error("Erro ao carregar dashboard", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo do marketplace e atalhos para gestão.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          to="/admin/estabelecimentos"
          icon={<Building2 className="h-5 w-5" />}
          label="Estabelecimentos"
          value={loading ? "—" : String(stats?.estabelecimentos ?? 0)}
        />
        <StatCard
          to="/admin/reservas"
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Reservas pendentes"
          value={loading ? "—" : String(stats?.reservasPendentes ?? 0)}
          highlight
        />
        <StatCard
          to="/admin/conteudo"
          icon={<FileText className="h-5 w-5" />}
          label="Conteúdos TEA"
          value={loading ? "—" : String(stats?.conteudos ?? 0)}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Famílias cadastradas"
          value={loading ? "—" : String(stats?.familias ?? 0)}
        />
      </div>

      <section className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-display font-semibold text-foreground">Atalhos rápidos</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
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
