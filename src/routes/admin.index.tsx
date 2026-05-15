import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchDashboardStats, type DashboardStats } from "@/lib/queries";
import { Users, Building2, ClipboardList, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type RecentRow = {
  id: string;
  tipo: "familia" | "estabelecimento";
  nome: string | null;
  cidade: string | null;
  estado: string | null;
  criado_em: string;
  status: string | null;
};

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recents, setRecents] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [s, fams, ests] = await Promise.all([
          fetchDashboardStats(),
          supabase
            .from("familia_profiles")
            .select("id, nome_responsavel, cidade, estado, criado_em, status")
            .order("criado_em", { ascending: false })
            .limit(10),
          supabase
            .from("estabelecimento_profiles")
            .select("id, nome_responsavel, cidade, estado, criado_em, status")
            .order("criado_em", { ascending: false })
            .limit(10),
        ]);
        setStats(s);
        const merged: RecentRow[] = [
          ...(fams.data ?? []).map((f) => ({
            id: f.id,
            tipo: "familia" as const,
            nome: f.nome_responsavel,
            cidade: f.cidade,
            estado: f.estado,
            criado_em: f.criado_em,
            status: f.status,
          })),
          ...(ests.data ?? []).map((e) => ({
            id: e.id,
            tipo: "estabelecimento" as const,
            nome: e.nome_responsavel,
            cidade: e.cidade,
            estado: e.estado,
            criado_em: e.criado_em,
            status: e.status,
          })),
        ]
          .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
          .slice(0, 10);
        setRecents(merged);
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
    <div className="space-y-8 max-w-7xl">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do Turismo Azul.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-5">
        <MetricCard
          icon={<Users className="h-6 w-6" />}
          label="Famílias cadastradas"
          value={fmt(stats?.total_familias)}
          accent="bg-blue-50 text-blue-700"
        />
        <MetricCard
          icon={<Building2 className="h-6 w-6" />}
          label="Estabelecimentos cadastrados"
          value={fmt(stats?.total_estabelecimentos)}
          accent="bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          icon={<ClipboardList className="h-6 w-6" />}
          label="Perfis TEA preenchidos"
          value={fmt(stats?.familias_com_perfil_tea)}
          accent="bg-violet-50 text-violet-700"
        />
        <MetricCard
          icon={<Sparkles className="h-6 w-6" />}
          label="Novos cadastros esta semana"
          value={fmt(stats?.novos_esta_semana)}
          accent="bg-amber-50 text-amber-700"
        />
      </div>

      <section className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">Cadastros recentes</h2>
          <span className="text-xs text-muted-foreground">Últimos 10</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Carregando…</div>
        ) : recents.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Nenhum cadastro recente.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recents.map((r) => (
                <TableRow key={`${r.tipo}-${r.id}`}>
                  <TableCell className="font-medium">{r.nome ?? "—"}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.tipo === "familia" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {r.tipo === "familia" ? "Família" : "Estabelecimento"}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {[r.cidade, r.estado].filter(Boolean).join(" / ") || "—"}
                  </TableCell>
                  <TableCell className="text-foreground/70 text-xs">
                    {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={r.tipo === "familia" ? "/admin/familias" : "/admin/estabelecimentos"}
                      className="text-xs text-primary hover:underline"
                    >
                      Abrir →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="mt-3 text-4xl font-display font-bold text-foreground">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string | null }) {
  const s = status ?? "—";
  const tone =
    s === "ativo"
      ? "bg-emerald-50 text-emerald-700"
      : s === "pendente"
      ? "bg-amber-50 text-amber-700"
      : s === "inativo"
      ? "bg-gray-100 text-gray-600"
      : "bg-gray-50 text-gray-500";
  return <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${tone}`}>{s}</span>;
}
