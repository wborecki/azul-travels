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
        <h1 className="text-2xl font-bold text-[#1a2f5e]">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do Turismo Azul.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-5">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Famílias cadastradas"
          value={fmt(stats?.total_familias)}
          iconBg="#dbeafe"
          iconColor="#2563eb"
        />
        <MetricCard
          icon={<Building2 className="h-5 w-5" />}
          label="Estabelecimentos cadastrados"
          value={fmt(stats?.total_estabelecimentos)}
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
        <MetricCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Perfis TEA preenchidos"
          value={fmt(stats?.familias_com_perfil_tea)}
          iconBg="#fef9c3"
          iconColor="#a16207"
        />
        <MetricCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Novos cadastros esta semana"
          value={fmt(stats?.novos_esta_semana)}
          iconBg="#fce7f3"
          iconColor="#be185d"
        />
      </div>

      <section className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <h2 className="font-semibold text-[#1a2f5e]">Cadastros recentes</h2>
          <span className="text-xs text-muted-foreground">Últimos 10</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Carregando…</div>
        ) : recents.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Nenhum cadastro recente.</div>
        ) : (
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-foreground/60">Nome</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-foreground/60">Tipo</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-foreground/60">Cidade/UF</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-foreground/60">Data</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-foreground/60">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-foreground/60 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recents.map((r) => (
                <TableRow key={`${r.tipo}-${r.id}`} className="hover:bg-[#f8fafc] transition-colors">
                  <TableCell className="font-medium">
                    {r.nome ?? <EmptyCell />}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.tipo === "familia"
                        ? "bg-[#dbeafe] text-[#1d4ed8]"
                        : "bg-[#dcfce7] text-[#15803d]"
                    }`}>
                      {r.tipo === "familia" ? "Família" : "Estabelecimento"}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {[r.cidade, r.estado].filter(Boolean).join(" / ") || <EmptyCell />}
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

function EmptyCell() {
  return <span className="text-xs italic text-muted-foreground">Não informado</span>;
}

function MetricCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-foreground/60 uppercase tracking-wider">
            {label}
          </p>
          <p
            className="mt-3 font-bold text-[#1a2f5e]"
            style={{ fontSize: 36, lineHeight: 1.1 }}
          >
            {value}
          </p>
        </div>
        <span
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 40, height: 40, background: iconBg, color: iconColor }}
        >
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
      ? "bg-[#dcfce7] text-[#15803d]"
      : s === "pendente"
      ? "bg-[#fef9c3] text-[#a16207]"
      : s === "inativo"
      ? "bg-gray-100 text-gray-600"
      : "bg-gray-50 text-gray-500";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${tone}`}>{s}</span>;
}
