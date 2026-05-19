import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchDashboardStats, type DashboardStats } from "@/lib/queries";
import {
  Users,
  Building2,
  ClipboardList,
  Sparkles,
  Hourglass,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowRight,
  Star,
} from "lucide-react";
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

type LeadRow = {
  id: string;
  nome: string;
  email: string;
  criado_em: string;
};

const NAVY = "#1a2f5e";
const GOLD = "#c9a84c";
const PAGE_SIZE = 5;

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leadsFamiliasCount, setLeadsFamiliasCount] = useState<number | null>(null);
  const [seloAzulPendentes, setSeloAzulPendentes] = useState<number | null>(null);
  const [recents, setRecents] = useState<RecentRow[]>([]);
  const [leadsRecent, setLeadsRecent] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const [s, fams, ests, leadsCount, leadsList] = await Promise.all([
          fetchDashboardStats(),
          supabase
            .from("familia_profiles")
            .select("id, nome_responsavel, cidade, estado, criado_em, status")
            .order("criado_em", { ascending: false })
            .limit(20),
          supabase
            .from("estabelecimento_profiles")
            .select("id, nome_responsavel, cidade, estado, criado_em, status")
            .order("criado_em", { ascending: false })
            .limit(20),
          supabase.from("leads_familias").select("id", { count: "exact", head: true }),
          supabase
            .from("leads_familias")
            .select("id, nome, email, criado_em")
            .order("criado_em", { ascending: false })
            .limit(5),
        ]);
        setStats(s);
        setLeadsFamiliasCount(leadsCount.count ?? 0);
        setLeadsRecent((leadsList.data ?? []) as LeadRow[]);
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
        ].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
        setRecents(merged);
      } catch (err) {
        toast.error("Erro ao carregar dashboard", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
      setLoading(false);
    })();
  }, []);

  const fmt = (n?: number) => (loading ? "-" : String(n ?? 0));

  const totalPages = Math.max(1, Math.ceil(recents.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => recents.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [recents, page],
  );

  async function exportLeads() {
    try {
      const { data, error } = await supabase
        .from("leads_familias")
        .select("nome, email, whatsapp, cidade, estado, criado_em, origem")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const header = ["nome", "email", "whatsapp", "cidade", "estado", "criado_em", "origem"];
      const csv = [
        header.join(","),
        ...rows.map((r) =>
          header
            .map((k) => {
              const v = (r as Record<string, unknown>)[k];
              const s = v == null ? "" : String(v);
              return `"${s.replace(/"/g, '""')}"`;
            })
            .join(","),
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-familias-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length} leads exportados`);
    } catch (err) {
      toast.error("Falha ao exportar", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-5 max-w-7xl pb-2">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral do Turismo Azul.</p>
      </header>

      {/* Métricas em linha única */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          icon={<Hourglass className="h-4 w-4" />}
          label="Leads lista de espera"
          value={loading ? "-" : String(leadsFamiliasCount ?? 0)}
          iconBg="#fff4dc"
          iconColor={GOLD}
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Famílias com conta"
          value={fmt(stats?.total_familias)}
          iconBg="#dbeafe"
          iconColor="#2563eb"
        />
        <MetricCard
          icon={<Building2 className="h-4 w-4" />}
          label="Estabelecimentos"
          value={fmt(stats?.total_estabelecimentos)}
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
        <MetricCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Perfis TEA preenchidos"
          value={fmt(stats?.familias_com_perfil_tea)}
          iconBg="#fef9c3"
          iconColor="#a16207"
        />
        <MetricCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Novos esta semana"
          value={fmt(stats?.novos_esta_semana)}
          iconBg="#fce7f3"
          iconColor="#be185d"
        />
      </div>

      {/* Conteúdo em duas colunas */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Cadastros recentes (60%) */}
        <section className="lg:col-span-3 bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
            <h2 className="font-semibold text-sm" style={{ color: NAVY }}>
              Cadastros recentes
            </h2>
            <span className="text-xs text-muted-foreground">
              {loading ? "" : `${recents.length} no total`}
            </span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
          ) : recents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum cadastro recente.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-[#f8fafc]">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/60">
                      Nome
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/60">
                      Tipo
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/60">
                      Cidade/UF
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/60">
                      Data
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/60 text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow
                      key={`${r.tipo}-${r.id}`}
                      className="hover:bg-[#f8fafc] transition-colors"
                    >
                      <TableCell className="font-medium py-2 text-sm">
                        {r.nome ?? <EmptyCell />}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            r.tipo === "familia"
                              ? "bg-[#dbeafe] text-[#1d4ed8]"
                              : "bg-[#dcfce7] text-[#15803d]"
                          }`}
                        >
                          {r.tipo === "familia" ? "Família" : "Estab."}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground/80 py-2 text-sm">
                        {[r.cidade, r.estado].filter(Boolean).join(" / ") || <EmptyCell />}
                      </TableCell>
                      <TableCell className="text-foreground/70 py-2 text-xs">
                        {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <Link
                          to={
                            r.tipo === "familia" ? "/admin/familias" : "/admin/estabelecimentos"
                          }
                          className="text-xs hover:underline"
                          style={{ color: NAVY }}
                        >
                          Abrir →
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-5 py-2.5 border-t border-[#e5e7eb] flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#e5e7eb] disabled:opacity-40 hover:bg-[#f8fafc]"
                  >
                    <ChevronLeft className="h-3 w-3" /> Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#e5e7eb] disabled:opacity-40 hover:bg-[#f8fafc]"
                  >
                    Próxima <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Coluna direita (40%) */}
        <aside className="lg:col-span-2 space-y-4">
          {/* Lista de Espera */}
          <section className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <div
              className="px-5 py-3 border-b border-[#e5e7eb] flex items-center justify-between"
              style={{ background: "linear-gradient(90deg,#fff8e6,#ffffff)" }}
            >
              <h2 className="font-semibold text-sm" style={{ color: NAVY }}>
                Lista de Espera
              </h2>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: "#fff4dc", color: GOLD }}
              >
                {loading ? "…" : `${leadsFamiliasCount ?? 0} total`}
              </span>
            </div>
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Carregando…</div>
            ) : leadsRecent.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Nenhum lead ainda.
              </div>
            ) : (
              <ul className="divide-y divide-[#f1f5f9]">
                {leadsRecent.map((l) => (
                  <li key={l.id} className="px-5 py-2.5 hover:bg-[#f8fafc] transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: NAVY }}>
                          {l.nome}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                      </div>
                      <span className="text-[10px] text-foreground/60 shrink-0">
                        {new Date(l.criado_em).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Ações Rápidas */}
          <section className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#e5e7eb]">
              <h2 className="font-semibold text-sm" style={{ color: NAVY }}>
                Ações rápidas
              </h2>
            </div>
            <div className="p-3 space-y-2">
              <QuickAction to="/admin/familias" label="Ver todas as famílias" />
              <QuickAction to="/admin/estabelecimentos" label="Ver estabelecimentos" />
              <button
                onClick={exportLeads}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[#e5e7eb] hover:border-[var(--gold)] hover:bg-[#fffbe9] transition-colors text-sm font-medium"
                style={{ ["--gold" as never]: GOLD, color: NAVY }}
              >
                <span className="inline-flex items-center gap-2">
                  <Download className="h-4 w-4" style={{ color: GOLD }} />
                  Exportar leads
                </span>
                <ArrowRight className="h-4 w-4 opacity-50" />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[#e5e7eb] hover:border-[#1a2f5e]/40 hover:bg-[#f8fafc] transition-colors text-sm font-medium"
      style={{ color: NAVY }}
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 opacity-50" />
    </Link>
  );
}

function EmptyCell() {
  return <span className="text-xs italic text-muted-foreground">—</span>;
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
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: 36, height: 36, background: iconBg, color: iconColor }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-foreground/60 uppercase tracking-wider leading-tight">
            {label}
          </p>
          <p
            className="font-bold leading-none mt-1"
            style={{ color: NAVY, fontSize: 22 }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
